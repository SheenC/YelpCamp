//nodenv
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

//express
const express = require('express');

const path = require('path');
//mongo
const mongoose = require('mongoose');
//ejs-mate
const ejsMate = require('ejs-mate');
//cookie session
const session = require('express-session');
//flash
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
//update
const methodOverride = require('method-override');
//passport
const passport = require('passport');
const LocalStrategy = require('passport-local');
//user
const User = require('./models/user');

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

//router
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const userRoutes = require('./routes/user');
const MongoDBStore = require("connect-mongo")(session);
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

//'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

//ejs-mate
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//create
app.use(express.urlencoded({ extended: true }));
//update
app.use(methodOverride('_method'));
//serving static assets /public/hello.js
app.use(express.static(path.join(__dirname, 'public')));

// To remove data, use:
app.use(mongoSanitize({
    replaceWith: '_'
}));

//connect-mongo
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60 //24h
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

//cookie session
const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        //expire, a week
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet({ contentSecurityPolicy: false }));
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];

const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dvauplkp8/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash('error');
    next();
})

//router
app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);


//home
app.get('/', (req, res) => {
    // res.send('Hello from yelp camp!');
    res.render('home');
});

/*
app.get('/makecampground', async (req, res) => {
    const camp = new Campground({
        title: 'My Back Yard',
        description: 'Cheap Camping'
    });
    await camp.save();
    res.send(camp);
});
*/


//apply to all the paths
app.all('*', (req, res, next) => {
    //res.send("404!!!");
    next(new ExpressError('Page Not Found', 404));
});

//handle the error
app.use((err, req, res, next) => {
    //res.send("Something went wrong!");
    //const { statusCode = 500, message = "Somethng went wrong!" } = err;
    //res.status(statusCode).send(message);
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Somethng went wrong!";
    res.status(statusCode).render('error', { err });

})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});