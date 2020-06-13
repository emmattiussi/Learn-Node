const mongoose = require('mongoose')
const Store = mongoose.model('Store')

exports.homePage = (req, res) => {
  res.render('index');
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  // 1. Query database for list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores })
}

exports.editStore = async (req, res) => {
  // 1. Get specific store to edit
  const store = await Store.findOne({ _id: req.params.id })
  // 2. Confirm user is owner of store
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  // 1. Find and update the store.
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // returns the new store instead of old one
    runValidators: true // re-runs validators (e.g. checks that name value is present)
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="stores/${store.slug}">View store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // 2. Redirect user to store and tell them it worked
}
