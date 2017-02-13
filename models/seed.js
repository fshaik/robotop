var mongoose = require('mongoose');    

var Outfit = require('./Outfit');

var uri = 'mongodb://heroku_tnlh9d9h:1dfism89bbluj1bne99g3ke7k7@ds151059.mlab.com:51059/heroku_tnlh9d9h';


mongoose.connect(uri);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {

  // Create seed data
  var wooster = new Outfit({
    temperature: 20,
    imageurl: "https://s3-us-west-2.amazonaws.com/winter-styles-20/20/1.jpg",
    sunglasses: true

  });

  var woostertwo = new Outfit({
    temperature: 20,
    imageurl: "https://s3-us-west-2.amazonaws.com/winter-styles-20/20/2.jpg",
    sunglasses: true

  });

  /*
   * First we'll add a few songs. Nothing is required to create the 
   * songs collection; it is created automatically when we insert.
   */
  var list = [wooster, woostertwo]
  Outfit.insertMany(list);

  Outfit.find({ sunglasses: true }).sort({ temperature: 1}).exec(function (err, docs){

    if(err) throw err;

    docs.forEach(function (doc) {
      console.log(doc['imageurl']);
    });

      mongoose.connection.db.close(function (err) {
        if(err) throw err;
      });
  });
});