const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

//https://res.cloudinary.com/dvauplkp8/image/upload/v1610267328/YelpCamp/hxklj9dxz2thdqidolag.jpg
ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
});

//add virtual into json
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    image: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    // properties: {
    //     popUpMarkUp: '<h3>'
    // }
}, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function() {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0,20)}...</p>`;
});

//https://mongoosejs.com/docs/api.html#model_Model.remove
//middleware

//doc deleted
CampgroundSchema.post('findOneAndDelete', async function(doc) {
    //if something is found and deleted
    if (doc) {
        //remove or deleteMany
        await Review.remove({
            _id: {
                $in: doc.reviews
            }
        })
    }
});

module.exports = mongoose.model('Campground', CampgroundSchema);