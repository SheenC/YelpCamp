//campground model
const Campground = require('../models/campground');
//MapBox Geocode
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async(req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async(req, res, next) => {
    //encode
    //app.use(express.urlencoded({ extended: true }));
    //res.send(req.body);
    if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400);
    const geoData = await geocoder.forwardGeocode({
            query: req.body.campground.location,
            limit: 1
        }).send()
        //console.log(geoData);
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.image = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${campground._id}`);
    /*
    try {
        const campground = new Campground(req.body.campground);
        await campground.save();
        res.redirect(`/campgrounds/${campground._id}`);
    } catch (e) {
        next(e);
    }
    */
}

module.exports.showCampground = async(req, res, next) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find the campground');
        return res.redirect('/campgrounds');
    }
    //res.render('campgrounds/show', { campground, msg: req.flash('success') });
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async(req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find the campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async(req, res, next) => {
    // res.send("It worked");
    const { id } = req.params;
    //... spread into the object
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.image.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { image: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully update a campground');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async(req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted a campground');
    res.redirect('/campgrounds');
}