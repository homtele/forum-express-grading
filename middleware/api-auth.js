const passport = require('../config/passport')

const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err)
    if (!user) return res.json({ status: 'error', message: 'unauthorized' })
    next()
  })(req, res, next)
}
const authenticatedAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ status: 'error', message: 'permission denied' })
  next()
}
module.exports = {
  authenticated,
  authenticatedAdmin
}
