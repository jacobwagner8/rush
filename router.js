const getUploadParams = require('./s3Upload');
const passport = require('koa-passport');
const Router = require('koa-router');

process.env.TZ = 'America/Los_Angeles';

// TODO: replace these dates with 2017's event dates
function getTodaysEventId() {
  const date = new Date();
  const month = date.getMonth(); // month is 0-indexed
  const day = date.getDate(); // day is 1-indexed. Why, I have no idea
  if (month === 2 && day === 29)
    return 1;
  if (month === 2 && day === 31)
    return 2;
  if (month === 3 && day === 5)
    return 3;
  if (month === 3 && day === 7)
    return 4;
  if (month === 3 && day === 9)
    return 5;
  return 0;
}

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

  router.get('/checkin', async(function*(ctx) {
    const rusheeInfo = yield models.rushee.getAllIdentifyingInfo();
    ctx.render('checkin', { rusheeInfo: rusheeInfo });
  }));

  router.post('/checkin/:rushee_id', async(function*(ctx) {
    const rusheeId = ctx.params.rushee_id;
    const eventNumber = getTodaysEventId();

    if (!eventNumber) {
      ctx.status = 400;
      ctx.body = 'Invalid rush date: ' + date.getMonth() + '/' + date.getDate();
      return;
    }

    yield models.rushee.checkin(rusheeId, eventNumber);
    ctx.status = 200;
  }));

  router.get('/register', function(ctx) {
    ctx.render('register');
  });

  router.get('/rushee-picture-upload/:file_name', async(function*(ctx) {
    const rusheeName = ctx.params.file_name;
    ctx.body = yield getUploadParams(rusheeName);
  }));

  router.post('/register', async(function*(ctx) {
    const vals = ctx.request.body;
    vals.avg_rating = 3;
    vals.num_ratings = 1;
    const rushee = yield models.rushee.create(vals);

    // Check in automatically
    const eventNumber = getTodaysEventId();
    if (eventNumber)
      yield models.rushee.checkin(rushee.id, eventNumber);

    ctx.status = 200;
  }));

  // Rushee list view
  router.get('/', async(function*(ctx) {
    const active_id = ctx.req.user.id;

    // Get Rushee data
    const rushees = yield models.rushee.getAllHydrated(active_id, 'RETREAT');

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

  router.post('/unrate/:rushee_id', async(function*(ctx) {
    const active = ctx.req.user;
    const rushee_id = parseInt(ctx.params.rushee_id);
    const result = yield models.rushee.unrate(rushee_id, active.id);
    ctx.body = result[0][0];
  }));

  router.get('/rushee/:rushee_id', async(function*(ctx) {
    const rushee_id = parseInt(ctx.params.rushee_id);
    const active_id = ctx.req.user.id;
    const queryResults = yield Promise.join(models.rushee.getOne(rushee_id),
                                            models.rushee.getTraits(rushee_id),
                                            models.rushee.getComments(rushee_id),
                                            models.rushee.getRating(rushee_id, active_id),
                                            models.rushee.getAttendance(rushee_id),
                                            models.rushee.getRatings(rushee_id));
    // determine if this user already voted for the trait
    const traits = queryResults[1];
    traits.map(trait => {
      trait.voted = trait.active_ids.indexOf(active_id) !== -1;
      return trait;
    });

    const rushee = queryResults[0].dataValues;
    rushee.own_rating = queryResults[3];

    const attendance = queryResults[4].map(x => x.event_id);

    ctx.render('rushee', {
      rushee: rushee,
      traits: traits,
      comments: queryResults[2],
      attendance: attendance,
      ratings: queryResults[5]
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
   */
  router.post('/rushee/:rushee_id/new_trait/:trait_name', async(function*(ctx) {
    const active_id = ctx.req.user.id;
    const rushee_id = parseInt(ctx.params.rushee_id);
    const trait_name = ctx.params.trait_name;

    const success = yield models.rushee.add_trait(rushee_id, active_id, trait_name);
    ctx.status = 200;
  }));

  /**
   * Upvote a trait that this rushee already has
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
