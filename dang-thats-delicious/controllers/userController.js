// Handles everything to do with user accounts.
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' })
}

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' })
}

exports.validateRegister = (req, res, next) => {
  // All these methods are from Express Validator, which we are using in app.js
  req.sanitizeBody('name')
  req.checkBody('name', 'You must supply a name').notEmpty()
  req.checkBody('email', 'That email is not valid').isEmail()
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  })
  req.checkBody('password', 'Password cannot be blank').notEmpty()
  req.checkBody('password-confirm', 'Confirmed password cannot be blank').notEmpty()
  req.checkBody('password-confirm', 'Your passwords do not match').equals(req.body.password)

  const errors = req.validationErrors()
  if (errors) {
    req.flash('error', errors.map(err =>  err.msg))
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    })
    return;
  }
  next();
}

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name
  })
  // register library from passportLocalMongoose, doesn't use promises, uses callbacks. Use promisify to make it a promise so we can await it.
  const register = promisify(User.register, User)
  await register(user, req.body.password) // will store hash of password
  next(); // pass to authcontroller.login
}
