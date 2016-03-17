const bodyParser  = require('koa-bodyparser');
const convert     = require('koa-convert');
const favicon     = require('koa-favicon');
const jade        = require('koa-jade-render');
const Koa         = require('koa');
const logger      = require('koa-logger');
const mount       = require('koa-mount');
const Sequelize   = require('sequelize')
const serve       = require('koa-static');
const session     = require('koa-session');
const winston     = require('winston');

const consoleLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true
    })
  ]
});

global._          = require('lodash');
global.Log        = consoleLogger;
global.Promise    = require('bluebird');
global.async      = Promise.coroutine;

Promise.longStackTraces();

const define_models = require('./models');
const define_router = require('./router');
const seed = require('./seed');
const define_authentication = require('./auth');

const secrets = require('./secrets');

// Connect to DB
const initDB = async(function*() {
  const db = new Sequelize('rush', 'rushadmin', secrets.rushadmin_db_pwd, {
    host: 'localhost',
    dialect: 'postgres',
    logging: Log.info
  })

  const models = define_models(db);
  yield db.drop();
  yield db.sync();
  Log.info('Seeding data');
  yield seed(db);
  Log.info('Finished Model Setup');
  return models
});

initDB()
  .then(models => {
    const app = new Koa();

    // convert legacy express middleware
    // to fancy promise-based middleware
    const _use = app.use; // decorator
    app.use = x => _use.call(app, convert(x));

    // log requests
    app.use(logger());

    // puts POST parameters in ctx.request.body
    app.use(bodyParser());

    // sessions
    app.keys = ['axel ericsson is the bitcoin bitch'];
    app.use(session(app));

    // auth
    const passport = define_authentication(models);
    app.use(passport.initialize());
    app.use(passport.session());

    // static file and favicon rendering
    app.use(favicon('dist/img/favicon.ico'));
    app.use(serve('dist'));
    app.use(jade('views'));

    const router = define_router(models);
    app.use(router.routes());

    app.listen(process.env.PORT || 3000);
    Log.info('Listening');
  });