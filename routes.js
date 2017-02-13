 // app/routes.js

// grab the nerd model we just created
var Outfit = require('./models/Outfit');

module.exports = function(app) {

//Outfit CRUD API

    app.get('/printallurls', function(req,res) {

        console.log("HIT THE URL /printallurls")



        Outfit.find({ sunglasses: false }).sort({ temperature: 1}).exec(function (err, docs) {

            if(err) throw err;

            docs.forEach(function (doc) {
              console.log(imageurl);
            });

            res.json(nerds);
            // Since this is an example, we'll clean up after ourselves.
              mongoose.connection.db.close(function (err) {
                if(err) throw err;
                
             });
          });

        });

};
