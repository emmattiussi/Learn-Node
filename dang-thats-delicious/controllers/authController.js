// Handles authentication and logging in.
const passport = require('passport')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login',
  successRedirect: '/',
  successFlash: 'You are now logged in.'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out.')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  //Check if user is authenticated
  if (req.isAuthenticated()) {
    next()
    return
  } // Checks with passport if user is authenticated
  req.flash('error', 'You must be logged in')
  res.redirect('/login')
}
