
var mongoose = require('mongoose');

var outfitSchema = mongoose.Schema({

    temperature: Number,
    imageurl: String,
    sunglasses: Boolean

});

module.exports = mongoose.model('outfits', outfitSchema);