// Handles authentication and logging in.
const passport = require('passport')
const crypto = require('crypto') // built into Node
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')
const mail = require('../handlers/mail')

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

exports.forgot = async (req, res) => {
  // 1. see if user exists
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('error', 'No account with that email exists')
    return res.redirect('/login')
  }
  // 2. Set reset tokens and expiry on account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000 // 1 hour from now
  await user.save()

  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  await mail.send({
    user,
    subject: 'Password reset',
    resetURL,
    filename: 'password-reset'
  })
  req.flash('success', `You have been emailed a password reset link.`)

  // 4. Redirect to login page after email token has been sent
  res.redirect('/login')
}

exports.reset = async (req, res) => {
  // 1. Check there is someone with token and token is not expired.
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // Token date is still in the future
  })
  // if no user, redirect to login
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired')
    return res.redirect('/login')
  }
  // 2. If there is a user, show reset password form.
  res.render('reset', { title: 'Reset your password' })
}

exports.confirmedPasswords = (req, res, next) => {
  if(req.body.password === req.body['confirm-password']) {
    next()
    return
  }
  req.flash('error', 'Passwords do not match')
  res.redirect('back')
}

exports.update = async (req, res) => {
  // Find user with all constraints
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // Token date is still in the future
  })
  // if no user, redirect to login
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired')
    return res.redirect('/login')
  }

  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  // Get rid of token and date
  user.resetPasswordToken = undefined; // This doesn't actually do anything, just queues up operation, have to call save
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save()
  await req.login(updatedUser)
  req.flash('success', 'Password successfully updated')
  res.redirect('/')
}
