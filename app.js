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

// Environment Detection
const dev = process.env.ENV !== 'prod';


if (dev) {
  var config  = require('./config');
  var secrets = require('./secrets');
}

// Logger
const consoleLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true
    })
  ]
});

// Globals
global._          = require('lodash');
global.Log        = consoleLogger;
global.Promise    = require('bluebird');
global.async      = Promise.coroutine;

Promise.longStackTraces();

const define_models = require('./models');
const define_router = require('./router');
const define_authentication = require('./auth');

// Connect to DB
const initDB = async(function*() {
  const db = new Sequelize('rushdb', 
      process.env.DB_USER || 'rushadmin', 
      process.env.DB_PWD || secrets.rushadmin_db_pwd, {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: Log.info
  });

  const models = define_models(db);
  if (dev && config.do_db_reset) {
    yield db.drop();
    yield db.sync();
    Log.info('Seeding data');
    yield require('./seed-dev')(db);
  }
  else yield db.sync();
  Log.info('Finished Model Setup');
  return models;
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
    const sessionKey = process.env.SESSION_KEY || 'test123abc geed city 4 lyfe';
    app.keys = [sessionKey];
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