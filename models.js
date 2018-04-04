/**
 * 
 * @param {*Array of int} ratings 
 */
function ratings_to_counts(ratings) {
  const counts = [0,0,0,0,0,0];
  ratings.forEach(rating => {
    ++counts[rating];
  });
  return counts;
}

function truncated_mean_with_prior(values) {
  let x = _.concat(values, 3);
  let n = _.floor(x.length/8);
  let truncated = _.slice(_.sortBy(x), n, x.length - n);
  return _.mean(truncated);
}

module.exports = function(db) {
  const retryableTransaction = require('./retryTransaction')(db);

  function name_column() {
    return {
      type: db.Sequelize.STRING(64),
      allowNull: false
    };
  };

  function name_index() {
    return {
      fields: ['name']
    };
  };

  function string_column(len) {
    return {
      type: db.Sequelize.STRING(len),
      allowNull: false,
      defaultValue: ''
    };
  }

  function text_column(len) {
    return {
      type: db.Sequelize.TEXT(len),
      allowNull: false,
      defaultValue: ''
    };
  }

  function bool_column() {
    return {
      type: db.Sequelize.BOOLEAN(),
      allowNull: false,
      defaultValue: false
    };
  }

  return {

    active: db.define('active', {
      name: name_column(),
      pwd: { type: db.Sequelize.STRING(32), allowNull: false }
    }, {
      indexes: [name_index()]
    }),

    rushee: db.define('rushee', {
      dorm: string_column(),
      room_number: string_column(),
      name: name_column(),
      phone_number: string_column(),
      // nickname: name_column(), // TODO
      profile_picture: string_column(),
      summary: text_column(),
      year: { type: db.Sequelize.ENUM('Fr', 'So', 'Jr', 'Sr'), allowNull: false },
      hide_for_checkin: { type: db.Sequelize.BOOLEAN },
      invited_to: { type: db.Sequelize.ENUM('NONE', 'FIRESIDE_SMOKES', 'RETREAT', 'BID'), allowNull: false, defaultValue: 'NONE' }
    }, {
      indexes: [ name_index() ],
      classMethods: {

        getOne: rushee_id => db.models.rushee.findById(rushee_id),

        // TODO for Eddie: defuglify
        getOneHydrated: async(function*(rushee_id, active_id) {
          const queryResults = yield Promise.join(db.models.rushee.getOne(rushee_id),
                                                  db.models.rushee.getTraits(rushee_id, active_id),
                                                  db.models.rushee.getComments(rushee_id),
                                                  db.models.rushee.getRating(rushee_id, active_id),
                                                  db.models.rushee.getAttendance(rushee_id),
                                                  db.models.rushee.getRatings(rushee_id));

          const rushee = queryResults[0].dataValues;
          rushee.traits = queryResults[1];
          rushee.ratings = ratings_to_counts(queryResults[5]);
          rushee.score = truncated_mean_with_prior(queryResults[5]);
          rushee.own_rating = queryResults[3];
          rushee.attendance = queryResults[4].map(x => x.event_id);

          return { rushee: rushee, comments: queryResults[2] };
        }),

        getAllHydrated: (active_id, invite_level) => db.query(
          "WITH _rushee_traits as" +
              " (select rushee_id as id, json_build_object('trait_name', trait_name, 'votes', count(trait_name)) as trait" +
              " from rushee_trait_votes group by id, trait_name order by count(trait_name) desc)" +
	          ', rushee_traits as (select id, array_agg(trait) as traits from _rushee_traits group by id)' +
	          ', rushee_ratings as (select rushee_id as id, array_agg(value) as ratings from ratings group by id)' +
            ', rushee_attendance as (select rushee_id as id, array_agg(event_id) as attendance from event_attendances group by id)' +
          " SELECT distinct on (id)" +
            " r.*" +
            ", coalesce(traits, '{}') as traits" +
            ", coalesce(ratings, '{}') as ratings" +
            ", coalesce(attendance, '{}') as attendance" + // should never be empty in practice
            ", (select value from ratings where r.id = rushee_id and active_id = " + active_id + ") as own_rating" +
          ' FROM rushees r' +
	          ' left join rushee_traits using(id)' +
	          ' left join rushee_ratings using(id)' +
            ' left join rushee_attendance using(id)' +
          // Uncomment the following line to hide rushees we didn't invite to a certain event
          // ' WHERE invited_to >= \'' + invite_level + '\' +
          ';'
        , { type: db.QueryTypes.SELECT })
          .then(rushees => {
            // add score (25% truncated mean with prior) to each rushee
            _.forEach(rushees, rushee => {
              rushee.score = truncated_mean_with_prior(rushee.ratings);
              rushee.ratings = ratings_to_counts(rushee.ratings);
            });
            // Return rushees ordered by descending score
            return _.sortBy(rushees, r => -r.score);
          }),

        getAllIdentifyingInfo: () => db.models.rushee.findAll({
          where: { hide_for_checkin: null },
          attributes: ['id', 'name', 'dorm', 'room_number'],
          order: 'name'
        }),

        getTopTraits: rushee_id => 
          db.models.rushee_trait.findAll({
            attributes: ['trait_name', 'votes'],
            where: { rushee_id: rushee_id, votes: { $gt: 0 } },
            order: 'votes DESC',
            limit: 3
          }),

        getRating: (rushee_id, active_id) =>
          db.models.rating.findOne({
            where: { rushee_id: rushee_id, active_id: active_id },
            attributes: ['value']
          }).then(result => result === null ? null : result.value),

        getRatings: (rushee_id, transaction) => 
          db.query("select coalesce(array_agg(value), '{}') as ratings from ratings where rushee_id = " + rushee_id + ";"
          , { type: db.QueryTypes.SELECT, transaction: transaction })
            .then(results => results[0].ratings),

        getTraits: (rushee_id, active_id) => db.query(
          'SELECT trait_name' +
            ', count(trait_name) as votes' +
            ', array_agg(name) as actives' +
            ', ' + active_id + ' = any(array_agg(active_id)) as voted' +
          ' FROM rushee_trait_votes' +
            ' join actives on id = active_id' +
          ' WHERE rushee_id = ' + rushee_id +
          ' GROUP BY trait_name' +
          ' ORDER BY votes desc' +
          ';'
        , { type: db.QueryTypes.SELECT }),

        /** upsert appears to have a bug */
        rate: (rushee_id, active_id, rating) =>
          retryableTransaction(t =>
            db.models.rating.destroy({
              where: { rushee_id: rushee_id, active_id: active_id },
              transaction: t
            })
            .then(() => db.models.rating.create({
              rushee_id: rushee_id,
              active_id: active_id,
              value: rating
            }, { transaction: t }))
            .then(() => db.models.rushee.getRatings(rushee_id, t))
            .then(ratings => ({ score: truncated_mean_with_prior(ratings), count: ratings.length }))
          ),

        unrate: (rushee_id, active_id) =>
          retryableTransaction(t =>
            db.models.rating.destroy({
              where: { rushee_id: rushee_id, active_id: active_id },
              transaction: t
            })
            .then(() => db.models.rushee.getRatings(rushee_id, t))
            .then(ratings => ({ score: truncated_mean_with_prior(ratings), count: ratings.length }))
          ),

        summarize: (rushee_id, summary) =>
          db.models.rushee.update({ summary: summary }, { where: { id: rushee_id } }),

        /** Adds trait to rushee
         */
        add_trait: (rushee_id, active_id, trait_name) =>
          retryableTransaction(t =>
            db.models.trait.upsert({ name: trait_name }, { transaction: t })
            .then(() => db.models.rushee_trait_vote.upsert({
              rushee_id: rushee_id,
              active_id: active_id,
              trait_name: trait_name
            }, { transaction: t }))
          , { isolationLevel: 'SERIALIZABLE' }),

        /** updates vote for this trait
         *  TODO: delete trait when at 0 votes. Also this should probably be split into 2 functions
         */
        vote_trait: (rushee_id, active_id, trait_name, vote) =>
          retryableTransaction(t => 
            (vote
              ? db.models.rushee_trait_vote.create({
                rushee_id: rushee_id,
                active_id: active_id,
                trait_name: trait_name
              }, { transaction: t })
              : db.models.rushee_trait_vote.destroy({
                where: {
                  rushee_id: rushee_id,
                  active_id: active_id,
                  trait_name: trait_name
                },
                transaction: t
              })
            )
          , { isolationLevel: 'SERIALIZABLE' }),

        getComments: rushee_id => {
          var query = ('SELECT text, (select name from actives where id = rushee_comments.active_id) as author ' +
            'FROM rushee_comments WHERE rushee_id = {0} ' +
            'ORDER BY "createdAt";'
          ).replace(/\{0\}/g, rushee_id);
          return db.query(query, { type: db.QueryTypes.SELECT });
        },

        comment: (rushee_id, active_id, comment) =>
          db.models.rushee_comment.create({
            rushee_id: rushee_id,
            active_id: active_id,
            text: comment
          }),

        checkin: (rushee_id, event_id) =>
          db.models.event_attendance.upsert({
            rushee_id: rushee_id,
            event_id: event_id
          }),

        getAttendance: rushee_id =>
          db.models.event_attendance.findAll({
            where: { rushee_id: rushee_id },
            attributes: ['event_id']
          })
      }
    }),

    rating: db.define('rating', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      active_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.active }, onDelete: 'cascade' },
      value: { type: db.Sequelize.INTEGER, allowNull: false, min: 1, max: 5 }
    }),

    trait: db.define('trait', {
      name: { type: db.Sequelize.STRING, primaryKey: true }
    }),

    rushee_trait_vote: db.define('rushee_trait_vote', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      trait_name: { type: db.Sequelize.STRING, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.trait, key: 'name' }, onDelete: 'cascade' },
      active_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.active }, onDelete: 'cascade' }
    }),

    rushee_comment: db.define('rushee_comment', {
      rushee_id: { type: db.Sequelize.INTEGER, references: { model: db.models.rushee }, onDelete: 'cascade', allowNull: false },
      active_id: { type: db.Sequelize.INTEGER, references: { model: db.models.active }, onDelete: 'cascade', allowNull: false },
      text: text_column()
    }),

    event: db.define('event', {}),

    event_attendance: db.define('event_attendance', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'event_attendance_pkey', references: { model: db.models.rushee }, onDelete: 'cascade', allowNull: false },
      event_id: { type: db.Sequelize.INTEGER, primaryKey: 'event_attendance_pkey', references: { model: db.models.event }, onDelete: 'cascade', allowNull: false }
    })

  };
};