const getUploadParams = require('./s3Upload');
const passport = require('koa-passport');
const Router = require('koa-router');

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

  router.get('/checkin', function(ctx) {
    ctx.render('checkin');
  });

  router.get('/register', function(ctx) {
    ctx.render('register');
  });

  router.get('/rushee-picture-upload/:file_name', async(function*(ctx) {
    const rusheeName = ctx.params.file_name;
    ctx.body = yield getUploadParams(file_name);
  }));

  router.post('/register', async(function*(ctx) {
    const vals = ctx.req.body;
    const success = models.rushee.create(vals);
    // TODO: set rushee attendance
    ctx.status = 200;
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
    const active_id = ctx.req.user.id;

    // Get Rushee data
    const rushees = yield models.rushee.getAllHydrated(active_id);

    // Render view
    ctx.render('index', { rushees: rushees });
  }));

  router.post('/rate/:rushee_id', async(function*(ctx) {
    const active = ctx.req.user;
    const rushee_id = parseInt(ctx.params.rushee_id);
    const rating = ctx.request.body.rating;
    const result = yield models.rushee.rate(rushee_id, active.id, rating);
    ctx.body = result[0][0];
  }));

  router.get('/rushee/:rushee_id', async(function*(ctx) {
    const rushee_id = parseInt(ctx.params.rushee_id);
    const active_id = ctx.req.user.id;
    const queryResults = yield Promise.join(models.rushee.getOne(rushee_id),
                                            models.rushee.getTraits(rushee_id),
                                            models.rushee.getComments(rushee_id),
                                            models.rushee.getRating(rushee_id, active_id));
    // determine if this user already voted for the trait
    const traits = queryResults[1];
    traits.map(trait => {
      trait.voted = trait.active_ids.indexOf(active_id) !== -1;
      return trait;
    });

    const rushee = queryResults[0].dataValues;
    rushee.ownRating = queryResults[3];

    ctx.render('rushee', {
      rushee: rushee,
      traits: traits,
      comments: queryResults[2]
    });
  }));

  router.post('/summary/:rushee_id', async(function*(ctx) {
    const rushee_id = parseInt(ctx.params.rushee_id);
    const summary = ctx.request.body.summary;
    const success = yield models.rushee.summarize(rushee_id, summary);
    ctx.status = 200;
  }));

  /**
   * Add a trait for this rushee
   * @param {[type]} ctx)          {    const active_id [description]
   * @yield {[type]} [description]
   */
  router.post('/rushee/:rushee_id/new-trait/:trait_name', async(function*(ctx) {
    const active_id = ctx.req.user.id;
    const rushee_id = parseInt(ctx.params.rushee_id);
    const trait_name = ctx.params.trait_name;

    const success = yield models.rushee.add_trait(rushee_id, active_id, trait_name);
    ctx.status = 200;
  }));

  /**
   * Upvote a trait that this rushee already has
   * @param {[type]} ctx)          {    const active_id [description]
   * @yield {[type]} [description]
   */
  router.post('/rushee/:rushee_id/trait/:trait_name', async(function*(ctx) {
    const active_id = ctx.req.user.id;
    const rushee_id = parseInt(ctx.params.rushee_id);
    const trait_name = ctx.params.trait_name;
    const vote = ctx.request.body.vote === 'true';

    const success = yield models.rushee.vote_trait(rushee_id, active_id, trait_name, vote);
    ctx.status = 200;
  }));

  router.post('/rushee/:rushee_id/comment', async(function*(ctx) {
    const rushee_id = parseInt(ctx.params.rushee_id);
    const active_id = ctx.req.user.id;
    const comment = ctx.request.body.comment;
    const success = yield models.rushee.comment(rushee_id, active_id, comment);
    ctx.status = 200;
  }));

  return router;
};
