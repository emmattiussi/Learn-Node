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
  photo: String
});

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

module.exports = mongoose.model('Store', storeSchema)
