var mongoose = require('mongoose');    

var uri = 'mongodb://heroku_tnlh9d9h:1dfism89bbluj1bne99g3ke7k7@ds151059.mlab.com:51059/heroku_tnlh9d9h';

mongoose.Promise = global.Promise

mongoose.connect(uri);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {

  // Create song schema
  var outfitSchema = mongoose.Schema({
    temperature: Number,
    imageurl: String,
    sunglasses: Boolean
  });

  // Store song documents in a collection called "outfits"
  var Outfit = mongoose.model('outfits', outfitSchema);

  // Create seed data
  var wooster = new Outfit({
    temperature: 21,
    imageurl: "https://s3-us-west-2.amazonaws.com/winter-styles-20/20/3.jpg",
    sunglasses: true

  });

  var woostertwo = new Outfit({
    temperature: 20,
    imageurl: "https://s3-us-west-2.amazonaws.com/winter-styles-20/20/4.jpg",
    sunglasses: true

  });

  /*
   * First we'll add a few songs. Nothing is required to create the 
   * songs collection; it is created automatically when we insert.
   */
  var list = [wooster, woostertwo]
  Outfit.insertMany(list);

  /*
   * Then we need to give Boyz II Men credit for their contribution
   * to the hit "One Sweet Day".
   */
  Outfit.update({ sunglasses: true}, { $set: { sunglasses: false} }, 
    function (err, numberAffected, raw) {

      if (err) return handleError(err);

      /*
       * Finally we run a query which returns all the hits that spend 10 or
       * more weeks at number 1.
       */
      Outfit.find({ sunglasses: false }).sort({ temperature: 1}).exec(function (err, docs){

        if(err) throw err;

        docs.forEach(function (doc) {
          console.log(imageurl);
        });

        // Since this is an example, we'll clean up after ourselves.
          mongoose.connection.db.close(function (err) {
            if(err) throw err;
            
        });
      });
    }
  )
});