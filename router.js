const Router = require('koa-router');
const passport = require('koa-passport');

module.exports = function defineRouter(models) {
  const router = new Router();

  router.get('/login', function(ctx) {
    if (ctx.isAuthenticated())
      ctx.redirect('/');
    else  
      ctx.render('login');
  });

  router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  router.use(function(ctx, next) {
    if (!ctx.isAuthenticated())
      ctx.redirect('/login');
    else
      return next();
  });
  // router.use(passport.authenticate('local', { failureRedirect: '/login' }));

  router.get('/', async(function*(ctx) {
    // TODO: check login status
    // Get Rushee data
    const rushees = yield models.rushee.getPage(0);
    console.log(rushees);
    ctx.render('index', { rushees: rushees });
  }));

  // API functions
  // router.get('/api/')

  return router;
};
