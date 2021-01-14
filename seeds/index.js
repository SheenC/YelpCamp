const mongoose = require('mongoose');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');
//..back
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// const sample = array => return array[Math.floor(Math.random() * array.length)];
const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const seedDB = async() => {
    await Campground.deleteMany({});
    // const c = new Campground({
    //     title: 'purple field'
    // });
    // await c.save();
    for (let i = 0; i < 200; i++) {
        //1000 cities
        const random1000 = Math.floor(Math.random() * 1000);
        const randomPrice = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '5ff71c401cfcea5fdb7fd3a9',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga adipisci consequatur tempora obcaecati repudiandae odit officia aut ex ipsum error, maiores sequi laboriosam ad asperiores accusamus architecto labore consectetur voluptatibus?',
            price: randomPrice,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            image: [{
                    url: "https://res.cloudinary.com/dvauplkp8/image/upload/v1610266900/YelpCamp/fffdiohj8kghijqkffzy.jpg",
                    filename: "YelpCamp/fffdiohj8kghijqkffzy"
                },
                {
                    url: "https://res.cloudinary.com/dvauplkp8/image/upload/v1610267328/YelpCamp/hxklj9dxz2thdqidolag.jpg",
                    filename: "YelpCamp/hxklj9dxz2thdqidolag"
                }
            ]
        })
        await camp.save();
    }
}

seedDB()
    .then(() => {
        mongoose.connection.close();
    });