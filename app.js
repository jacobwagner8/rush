#!/bin/node
const bodyParser  = require('koa-bodyparser');
const convert     = require('koa-convert');
const favicon     = require('koa-favicon');
const https       = require('https');
const jade        = require('koa-jade-render');
const Koa         = require('koa');
const logger      = require('koa-logger');
const mount       = require('koa-mount');
const Sequelize   = require('sequelize')
const serve       = require('koa-static');
const session     = require('koa-generic-session');
const cors = require('@koa/cors');
const winston     = require('winston');
require('dotenv').config()


const config  = require('./config');
const secrets  = require('./secrets');

// Logger
const consoleLogger = winston.createLogger({
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
  const db = new Sequelize('rush',
      config.db_user || 'rushadmin',
      secrets.db_pwd || 'password', {
    host: config.db_host || 'localhost',
    port: config.db_port || 5432,
    dialect: 'postgres',
    logging: (msg) => global.Log.info(msg)
  });

  const models = define_models(db);
  if (config.do_db_reset) {
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
    const sessionKey = secrets.session_key || 'test123abc geed city 4 lyfe';
    app.keys = [sessionKey];
    const config = {
        cookie: {
            path: '/',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // seven days in ms,
            overwrite: true,
            signed: true
        }
    };
    app.use(convert(session()));

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

    app.use(cors({origin: '*'}));

    app.listen(config.http_port || 8000);
    https.createServer(app.callback()).listen(config.https_port || 8443);
    Log.info('Listening');
  });
