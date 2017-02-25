const rushees_per_page = 25; // for rushee list view

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
      profile_picture: string_column(),
      summary: text_column(),
      avg_rating: { type: db.Sequelize.FLOAT, allowNull: true },
      num_ratings: { type: db.Sequelize.INTEGER, allowNull: true },
      year: { type: db.Sequelize.ENUM('Fr', 'So', 'Jr', 'Sr'), allowNull: false },
      hide_for_checkin: { type: db.Sequelize.BOOLEAN },
      invited_to: { type: db.Sequelize.ENUM('NONE', 'FIRESIDE_SMOKES', 'RETREAT', 'BID'), allowNull: false, defaultValue: 'NONE' }
    }, {
      indexes: [
        name_index(),
        { fields: [ { attribute: 'avg_rating', order: 'DESC' } ] }
      ],
      classMethods: {

        getOne: rushee_id => db.models.rushee.findById(rushee_id),

        getAllHydrated: (active_id, invite_level) => db.query('SELECT *, ' +
          '(select coalesce(array_agg(row_to_json(row)), \'{}\') ' +
            'from (select trait_name, votes from rushee_traits ' +
              'where rushee_id = r.id and votes > 0 ' +
              'order by votes desc limit 3 ' +
            ') row ' +
          ') as top_traits, ' +
          '(select value from ratings ' +
            'where rushee_id = r.id and active_id = ' + active_id +
          ') as own_rating, ' +
          '(select coalesce(array_agg(event_id), \'{}\') from (select event_id from event_attendances where rushee_id = r.id) event_ids) as event_attendance ' +
          'FROM rushees r '
          // Uncomment the following line to hide rushees we didn't invite to a certain event
          // + ' WHERE invited_to >= \'' + invite_level + '\''
          + ' ORDER BY avg_rating desc nulls last;'
        , { type: db.QueryTypes.SELECT }),

        getAllIdentifyingInfo: () => db.models.rushee.findAll({
          where: { hide_for_checkin: null },
          attributes: ['id', 'name', 'dorm'],
          order: 'name'
        }),

        /**
         * @Deprecated. Use getAllHydrated.
         * Get info for rushees on this page
         * @param  {int} pageNumber     0-indexed page number
         * @return {Promise<[Rushee]>}  rushees
         */ 
        getPage: async(function*(pageNumber) {
          const first = pageNumber * rushees_per_page;
          const last = (pageNumber + 1) * rushees_per_page - 1;

          return yield this.findAll({
            order: 'avg_rating DESC'
          });
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

        getRatings: rushee_id => 
          db.query('select value, count(value) from ratings where rushee_id = ' + rushee_id + ' group by value;'
          , { type: db.QueryTypes.SELECT })
            .then(results => {
              const ratings = [0,0,0,0,0,0];
              results.forEach(entry => {
                ratings[entry.value] = parseInt(entry.count);
              });
              return ratings;
            }),

        getTraits: rushee_id => {
          var query = ('' +
            'WITH trait_votes as (select * from rushee_trait_votes where rushee_id = {0}) ' +
            'SELECT trait_name, ' +
              'rushee_id, ' +
              'votes, ' +
              '(select array_agg(active_id) from trait_votes where trait_name = ts.trait_name) as active_ids, ' +
              '(select array_agg((select name from actives where id = active_id)) from trait_votes where trait_name = ts.trait_name) as actives ' +
              'from rushee_traits ts ' +
            'WHERE rushee_id = {0} and votes > 0' +
            'order by votes desc;'
          ).replace(/\{0\}/g, rushee_id);
          return db.query(query, { type: db.QueryTypes.SELECT});
        },

        /**
         * kill me.
         * @param  {[type]} rushee_id [description]
         * @param  {[type]} active_id [description]
         * @param  {[type]} rating    [description]
         * @return {[type]}           [description]
         */
        rate: (rushee_id, active_id, rating) =>
          retryableTransaction(t => 
            db.models.rating.destroy({
              where: { rushee_id: rushee_id, active_id: active_id },
              transaction: t
            }).then(() =>
              db.models.rating.create({
                rushee_id: rushee_id,
                active_id: active_id,
                value: rating
              }, { transaction: t })
            ).then(() => {
              var query = ('WITH rushee_ratings as (select value from ratings where rushee_id = {0} union all select 3) ' +
              'UPDATE rushees SET avg_rating = (select avg(value) from rushee_ratings) ' +
                ', num_ratings = (select count(value) from rushee_ratings) ' +
                'where id = {0} ' +
              'RETURNING avg_rating, num_ratings ' +
              ';').replace(/\{0\}/g, rushee_id);
              return db.query(query, { transaction: t });
            })
          , { isolationLevel: 'SERIALIZABLE' }),

        unrate: (rushee_id, active_id) =>
          retryableTransaction(t => 
            db.models.rating.destroy({
              where: { rushee_id: rushee_id, active_id: active_id },
              transaction: t
            }).then(() => {
              var query = ('WITH rushee_ratings as (select value from ratings where rushee_id = {0} union all select 3) ' +
              'UPDATE rushees SET avg_rating = (select avg(value) from rushee_ratings) ' +
                ', num_ratings = (select count(value) from rushee_ratings) ' +
                'where id = {0} ' +
              'RETURNING avg_rating, num_ratings ' +
              ';').replace(/\{0\}/g, rushee_id);
              return db.query(query, { transaction: t });
            })
          , { isolationLevel: 'SERIALIZABLE' }),

        summarize: (rushee_id, summary) =>
          db.models.rushee.update({ summary: summary }, { where: { id: rushee_id } }),

        /** Adds trait to rushee
         */
        add_trait: (rushee_id, active_id, trait_name) =>
          retryableTransaction(t =>
            db.models.trait.upsert({
              name: trait_name
            }, { transaction: t }).then(() =>
              db.models.rushee_trait_vote.upsert({
                rushee_id: rushee_id,
                active_id: active_id,
                trait_name: trait_name
              }, { transaction: t })
            ).then(() =>
              db.models.rushee_trait.findOrCreate({
                where: {
                  rushee_id: rushee_id,
                  trait_name: trait_name
                },
                transaction: t
              })
            ).then(() => {
              var query = ('WITH active_votes as (select active_id from rushee_trait_votes where rushee_id = {0} and trait_name = \'{1}\')' +
              'UPDATE rushee_traits SET votes = (select count(active_id) from active_votes) ' +
                'where rushee_id = {0} and trait_name = \'{1}\'' +
              ';')
                .replace(/\{0\}/g, rushee_id)
                .replace(/\{1\}/g, trait_name);
              return db.query(query, { transaction: t });
            })
          , { isolationLevel: 'SERIALIZABLE' }),

        /** updates vote for this trait
         *  TODO: delete trait when at 0 votes.
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
            ).then(() => {
              var query = ('WITH active_votes as (select active_id from rushee_trait_votes where rushee_id = {0} and trait_name = \'{1}\')' +
              'UPDATE rushee_traits SET votes = (select count(active_id) from active_votes) ' +
                'where rushee_id = {0} and trait_name = \'{1}\'' +
              ';')
                .replace(/\{0\}/g, rushee_id)
                .replace(/\{1\}/g, trait_name);
              return db.query(query, { transaction: t });
            })
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

    rushee_trait: db.define('rushee_trait', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      trait_name: { type: db.Sequelize.STRING, primaryKey: 'rushee_trait_pkey', references: { model: db.models.trait, key: 'name' }, onDelete: 'cascade' },
      votes: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    }, {
      indexes: [
        { fields: [ 'rushee_id', { attribute: 'votes', order: 'DESC'} ] }
      ]
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