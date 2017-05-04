 // app/routes.js

 const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  forecast = require('forecast'),
  mysql = require('mysql'),
  mongoose = require('mongoose');
  controllers = require('./controllers/index');
  
// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

var Outfit = require('./models/Outfit');
var request = require('request');
var Weather = require('./models/Weather');

module.exports = function(app) {


    app.get('/', function(req, res) {
     
        res.send('POOP');
        res.status(200).send(req.query['hub.challenge']);
     
    });

    /*
     * Use your own validation token. Check that the token used in the Webhook 
     * setup is the same token used here.
     *
     */
    app.get('/webhook', function(req, res) {  
      if (req.query['hub.mode'] === 'subscribe' &&
          req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
      } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);          
      }  
    });


    /*
     * All callbacks for Messenger are POST-ed. They will be sent to the same
     * webhook. Be sure to subscribe your app to your page to receive callbacks
     * for your page. 
     * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
     *
     */
    app.post('/webhook', function (req, res) {
      var data = req.body;

      // Make sure this is a page subscription
      if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
          var pageID = pageEntry.id;
          var timeOfEvent = pageEntry.time;

          // Iterate over each messaging event
          pageEntry.messaging.forEach(function(messagingEvent) {
            console.log("OBJECT: " , messagingEvent);
            if (messagingEvent.optin) {
              controllers.received.receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
              controllers.received.receivedMessage(messagingEvent);
            } else if (messagingEvent.delivery) {
              controllers.received.receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.postback) {
              controllers.received.receivedPostback(messagingEvent);
            } else if (messagingEvent.read) {
              controllers.received.receivedMessageRead(messagingEvent);
            } else if (messagingEvent.account_linking) {
              controllers.received.receivedAccountLink(messagingEvent);
            } else {
              console.log("Webhook received unknown messagingEvent: ", messagingEvent);
            }
          });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've 
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
      }
    });

    /*
     * This path is used for account linking. The account linking call-to-action
     * (sendAccountLinking) is pointed to this URL. 
     * 
     */
    app.get('/authorize', function(req, res) {
      var accountLinkingToken = req.query.account_linking_token;
      var redirectURI = req.query.redirect_uri;

      // Authorization Code should be generated per user by the developer. This will 
      // be passed to the Account Linking callback.
      var authCode = "1234567890";

      // Redirect users to this URI on successful login
      var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

      res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
      });
    });


//Outfit CRUD API

    app.get('/api/printalloutfits', function(req,res) {

        console.log("HIT THE URL /printallurls")

        Outfit.find({ sunglasses: true }).sort({ temperature: 1}).exec(function (err, docs) {

            if(err) throw err;

            console.log(docs);

            docs.forEach(function (doc) {
               

            });

            res.json(docs);
            // Since this is an example, we'll clean up after ourselves.

        });

    });

  app.post('/api/weather', function (req, res) {
    var data = req.body;
    var weather = new Weather(data);

    console.log("Weather API recvied", data);

    weather.save(function (err, result) {

      if (err) {
        console.log(err)
        res.send(err);
        return err;
      }

       console.log( result, ' saved to database');
       res.send(result);

    
    });

  });

  app.get('/api/weather', function (req, res) {

    //Decides if weather should send

    var [y,t] = req.body;
    
    console.log(y,t)

     Weather.findOne().where("time").gte(y).lte(t).exec(function (err, weather) {

       if(err) throw err;

       console.log(weather.time, weather.summary);

        res.json(weather);
    //     // Since this is an example, we'll clean up after ourselves.

     });

  });

};
