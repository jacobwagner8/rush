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

  // Handle login requests
  router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  // Require authentication for all non-login endpoints
  router.use(function(ctx, next) {
    if (!ctx.isAuthenticated())
      ctx.redirect('/login');
    else
      return next();
  });

  // Rushee list view
  router.get('/', async(function*(ctx) {
    // Get Rushee data
    const rushees = yield models.rushee.getPage(0);
    // Render view
    ctx.render('index', { rushees: rushees });
  }));

  router.post('/rate', async(function*(ctx) {
    const active = ctx.req.user;
    const rushee = ctx.request.body.rushee_id;
    const rating = ctx.request.body.rating;
    const success = yield models.rushee.rate(rushee, active.id, rating);
    ctx.status = success === true ? 200 : ctx.status;
  }));

  router.get('/rushee/:rushee_id', async(function*(ctx) {
    const rushee_id = parseInt(ctx.params.rushee_id);
    const rushee = yield models.rushee.getOne(rushee_id);
    ctx.render('rushee', { rushee: rushee });
  }));

  return router;
};
