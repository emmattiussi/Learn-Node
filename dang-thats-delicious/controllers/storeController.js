const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const User = mongoose.model('User')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({
        message: 'That file type isn\'t allowed'
      }, false)
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index');
}

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  })
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => { // Has next because this is a middleware that passes data along, not to the client
  // Check if there is no new file to resize
  if (!req.file) {
    next(); // Skip to next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`
  // Now we resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)
  // once we've written to file system, keep going
  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // Gets currently logged in user to populate author field.
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  const page = req.params.page || 1
  const limit = 3
  const skip = (page * limit) - limit
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' })
  const countPromise = Store.count();

  const [ stores, count ] = await Promise.all([storesPromise, countPromise])

  const pages = Math.ceil(count / limit)

  if (!stores.length && skip) {
    req.flash('info', `You asked for page ${page}. But that doesn't exist, so I put you on ${pages}.`)
    res.redirect(`/stores/page/${pages}`)
    return;
  }

  res.render('stores', {
    title: 'Stores',
    stores, count, page, pages
  })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it') // could have also flashed the error and redirected.
  }
}

exports.editStore = async (req, res) => {
  // 1. Get specific store to edit
  const store = await Store.findOne({
    _id: req.params.id
  })
  // 2. Confirm user is owner of store. Not middleware because we have to find store before we can do a check.
  confirmOwner(store, req.user)
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', {
    title: `Edit ${store.name}`,
    store
  })
}

exports.updateStore = async (req, res) => {
  // Set location data to be a Point
  req.body.location.type = 'Point'
  // 1. Find and update the store.
  const store = await Store.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true, // returns the new store instead of old one
    runValidators: true // re-runs validators (e.g. checks that name value is present)
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="stores/${store.slug}">View store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // 2. Redirect user to store and tell them it worked
}

exports.getStoreBySlug = async (req, res, next) => {
  // 1. Get store by slug from database
  const store = await Store.findOne({
    slug: req.params.slug
  }).populate('author reviews')

  // 1b. Handle url error;
  if (!store) return next()
  // 2. Render store page by sending store object
  res.render('store', {
    title: store.name,
    store
  })
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag
  const tagQuery = tag || {
    $exists: true
  } // either the selected tag or any store that has a tag property on it.
  // Get a list of all Stores by creating static method that lives on store model
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({
    tags: tagQuery
  })
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise])
  res.render('tag', {
    tags,
    title: 'Tags',
    tag,
    stores
  })
}

exports.searchStores = async (req, res) => {
  const stores = await Store.find({
    $text: {
      $search: req.query.q,
    }
  }, {
    score: {
      $meta: 'textScore'
    }
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  .limit(5)

  res.json(stores)
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat)
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // in meters, 10km
      }
    }
  }
  const stores = await Store.find(query).select('slug name description location photo')

  res.json(stores)
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' })
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet' // not $push because we want the adding to be unique
  const user = await User
  .findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id }},
    { new: true }
  )

  res.json(user)
}

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts } // find any stores which id is in an array
  })
  res.render('stores', {
    title: 'Hearts',
    stores
  })
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores()
  res.render('topStores', { stores, title: 'Top stores'})
}
