const rushees_per_page = 25; // for rushee list view

module.exports = function(db) {
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
      net_votes: { type: db.Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      year: { type: db.Sequelize.ENUM('Fr', 'So', 'Jr', 'Sr'), allowNull: false }
    }, {
      indexes: [
        name_index(),
        { fields: [ { attribute: 'net_votes', order: 'DESC' } ] }
      ],
      classMethods: {
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
        })
      }
    }),

    vote: db.define('vote', {
      active_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.active }, onDelete: 'cascade' },
      rushee_id: { type: db.Sequelize.INTEGER, primaryKey: 'vote_pkey', references: { model: db.models.rushee }, onDelete: 'cascade' },
      direction: { type: db.Sequelize.ENUM('DOWN', 'UP'), allowNull: false }
    }, {
      indexes: [
        { fields: ['rushee_id', 'direction'] }
      ]
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
    })

  };
};