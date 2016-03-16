const router = require('koa-router')();

router.get('/', async(function*(ctx) {
  // TODO: check login status
  ctx.render('index');
}));

module.exports = router;