const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates:  [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address: {
      type: String,
      required: 'You must supply an address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true } // virtuals don't get added to JSON and object unless you explicitly call it. 
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({
  location: '2dsphere'
})

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name)
  // Find other stores that have the same base slug (e.g. bar, bar-1, bar-2)
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx }) // this.constructor will be equal to Store by the time this function runs
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
})

// TODO - add another pre-save that uses a node library to sanitise data (remove any HTML/XSS attacks) before saving to database.

// Create static method on storeSchema to help getting tags list
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1 }}
  ]);
}

// Tell it to go off to another model and do a quick query to get all reviews, instead of saving reviews on Store model and Stores on review model.
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link
  localField: '_id', // which field on our Store needs to match with field on 'foreign' (i.e. review) model. Which field on store?
  foreignField: 'store' // which field on the review?
})
module.exports = mongoose.model('Store', storeSchema)
