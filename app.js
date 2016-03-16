const bodyParser  = require('koa-bodyparser');
const convert     = require('koa-convert');
const favicon     = require('koa-favicon');
const jade        = require('koa-jade-render');
const Koa         = require('koa');
const logger      = require('koa-logger');
const mount       = require('koa-mount');
const serve       = require('koa-static');
const winston     = require('winston');

const consoleLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: true
    })
  ]
});

global.Log        = consoleLogger;
global.Promise    = require('bluebird');
global.async      = Promise.coroutine;

Promise.longStackTraces();

const app = new Koa();

// convert legacy express middleware
// to fancy promise-based middleware
const _use = app.use; // decorator
app.use = x => _use.call(app, convert(x));

// log requests
app.use(logger());

// puts POST parameters in ctx.request.body
app.use(bodyParser());

// static file and favicon rendering
app.use(favicon('dist/img/favicon.ico'));
app.use(serve('dist'));
app.use(jade('views'));

const routes = require('./router').routes();
app.use(routes);

app.listen(process.env.PORT || 3000);