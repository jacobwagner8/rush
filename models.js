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
          // TODO: hydration
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
          const rushees = yield this.findAll();
          return rushees;
        }),

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
          , { isolationLevel: 'SERIALIZABLE' })
      }
    }),

    rating: db.define('rating', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      active_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.active }, onDelete: 'cascade' },
      value: { type: db.Sequelize.INTEGER, allowNull: false, min: 1, max: 5 }
    }),

    trait: db.define('trait', {
      text: string_column()
    }, {
      indexes: [
        { fields: ['text'], unique: true }
      ]
    }),

    rushee_trait: db.define('rushee_trait', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      trait_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_pkey', references: { model: db.models.trait }, onDelete: 'cascade' },
      votes: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    }, {
      indexes: [
        { fields: [ 'rushee_id', { attribute: 'votes', order: 'DESC'} ] }
      ]
    }),

    rushee_trait_vote: db.define('rushee_trait_vote', {
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      trait_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.trait }, onDelete: 'cascade' },
      active_id: { type: db.Sequelize.INTEGER, primaryKey: 'rushee_trait_vote_pkey', references: { model: db.models.active }, onDelete: 'cascade' }
    }),

    rushee_comment: db.define('rushee_comment', {
      rushee_id: { type: db.Sequelize.INTEGER, references: { model: db.models.rushee }, onDelete: 'cascade', allowNull: false },
      active_id: { type: db.Sequelize.INTEGER, references: { model: db.models.active }, onDelete: 'cascade', allowNull: false },
      text: text_column()
    })

  };
};