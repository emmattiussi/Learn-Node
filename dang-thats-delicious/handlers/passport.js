const passport = require('passport')
const mongoose = require('mongoose')
const User = mongoose.model('User')

passport.use(User.createStrategy())

// every time we have a request, it will ask passport what to do with the user when they are logged in, and we want passport to put all the user information on the request body. 
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
