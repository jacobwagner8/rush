const crypto        = require('crypto');
const LocalStrategy = require('passport-local').Strategy;
const passport      = require('koa-passport');

module.exports = function defineLocalStrategy(models) {

  passport.serializeUser(function(user, done) {
    done(null, user);
  })

  passport.deserializeUser(function(user, done) {
    done(null, user);
  })

  passport.use(new LocalStrategy(function(username, password, done) {
    const sha256 = crypto.createHash('sha256');
    sha256.update(password);
    const pwd_hash = sha256.digest('hex');

    models.active.findOne({
      where: { name: { $iLike: username }, pwd_hash: pwd_hash }
    })
      .then(user => {
        if (user === null) {
          Log.warn("Login Failed: Incorrect name or password");
          done(null, false, { message: "Incorrect name or password" });
        }
        else {
          const exposed_properties = _.pick(user.dataValues, ['id', 'name']);
          done(null, exposed_properties);
        }
      })
  }));

  return passport;
};
