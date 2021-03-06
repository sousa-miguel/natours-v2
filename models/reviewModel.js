const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // so whenever we have a calculated attribute (not stored in DB) it shows in output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index to prevent duplicate reviews (preveting the same user from making multiple reviews on the same tour)
reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

///////////////////////////////////////////////////
// QUERY MIDDLEWARES

// Populate author (user) of review
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'author',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'author',
    select: 'name photo',
  });

  next();
});

// Update ratings quantity and average on tour after creating a review
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //Review.calcAverageRatings(this.tour);
  this.constructor.calcAverageRatings(this.tour);
});

// Update ratings quantity and average on tour after updating or deleting a review
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne(); // get review (and tour)
  next();
});
// passing data from pre to post middleware
reviewSchema.post(/^findOneAnd/, async function () {
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
