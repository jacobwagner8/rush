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

  return {

    active: db.define('active', {
      name: name_column(),
      pwd_hash: { type: db.Sequelize.CHAR(64), allowNull: false }
    }, {
      indexes: [name_index()]
    }),

    rushee: db.define('rushee', {
      dorm: string_column(),
      name: name_column(),
      profile_picture: string_column(),
      summary: text_column(),
      avg_rating: { type: db.Sequelize.FLOAT, allowNull: true },
      year: { type: db.Sequelize.ENUM('Fr', 'So', 'Jr', 'Sr'), allowNull: false }
    }, {
      indexes: [
        name_index(),
        { fields: [ { attribute: 'avg_rating', order: 'DESC' } ] }
      ],
      classMethods: {

        getOne: async(function*(rushee_id) {
          const rushee = yield this.findById(rushee_id);
          return rushee;
        }),

        /**
         * Get info for rushees on this page
         * @param  {int} pageNumber     0-indexed page number
         * @return {Promise<[Rushee]>}  rushees
         */ 
        getPage: async(function*(pageNumber) {
          const first = pageNumber * rushees_per_page;
          const last = (pageNumber + 1) * rushees_per_page - 1;

          const rushees = yield this.findAll({
            order: 'avg_rating DESC'
          });

          // get top rushee traits
          const rushees_with_traits = yield Promise.all(rushees.map(async(function*(rushee) {
            const topTraits_ = yield db.models.rushee_trait.findAll({
              attributes: ['trait_name', 'votes'],
              where: { rushee_id: rushee.id },
              order: 'votes DESC'
            });
            const topTraits = topTraits_.map(x => x.dataValues);
            rushee.dataValues.topTraits = topTraits;
            return rushee.dataValues;
          })));

          return rushees_with_traits;
        }),

        getTraits: rushee_id => {
          var query = ('' +
            'WITH trait_votes as (select * from rushee_trait_votes where rushee_id = {0}) ' +
            'SELECT trait_name, ' +
              'votes, ' +
              '(select array_agg((select name from actives where id = active_id)) from trait_votes where trait_name = ts.trait_name) as actives ' +
              'from rushee_traits ts ' +
            'WHERE rushee_id = {0} ' +
            'order by votes desc;'
          ).replace(/\{0\}/g, rushee_id);
          return db.query(query, { type: db.QueryTypes.SELECT});
        },

        rate: (rushee_id, active_id, rating) =>
          retryableTransaction(t => 
            db.models.rating.upsert({
              rushee_id: rushee_id,
              active_id: active_id,
              value: rating
            }, { transaction: t }).then(() => {
              var query = ('WITH rushee_ratings as (select value from ratings where rushee_id = {0})' +
              'UPDATE rushees SET avg_rating = (select avg(value) from rushee_ratings)' +
                'where id = {0}' +
              ';').replace(/\{0\}/g, rushee_id);
              return db.query(query, { transaction: t });
            })
          , { isolationLevel: 'SERIALIZABLE' }),

        summarize: (rushee_id, summary) =>
          db.models.rushee.update({ summary: summary }, { where: { id: rushee_id } })
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
    })

  };
};