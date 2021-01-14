//campground model
const Campground = require('../models/campground');
//review model
const Review = require('../models/review');

module.exports.createReview = async(req, res, next) => {
    const campground = await Campground.findById(req.params.id);
    //form name review[...]
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created a new comment');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted a comment');
    res.redirect(`/campgrounds/${id}`);
}