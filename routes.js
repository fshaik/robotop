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
              receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
              controllers.receivedMessage(messagingEvent);
            } else if (messagingEvent.delivery) {
              receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.postback) {
              receivedPostback(messagingEvent);
            } else if (messagingEvent.read) {
              receivedMessageRead(messagingEvent);
            } else if (messagingEvent.account_linking) {
              receivedAccountLink(messagingEvent);
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



    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to 
     * Messenger" plugin, it is the 'data-ref' field. Read more at 
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    function receivedAuthentication(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;
      var timeOfAuth = event.timestamp;

      // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
      // The developer can set this to an arbitrary value to associate the 
      // authentication callback with the 'Send to Messenger' click event. This is
      // a way to do account linking when the user clicks the 'Send to Messenger' 
      // plugin.
      var passThroughParam = event.optin.ref;

      console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam, 
        timeOfAuth);

      // When an authentication is received, we'll send a message back to the sender
      // to let them know it was successful.
      sendMessage.sendTextMessage(senderID, "Authentication successful");
    }


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about 
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    function receivedDeliveryConfirmation(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;
      var delivery = event.delivery;
      var messageIDs = delivery.mids;
      var watermark = delivery.watermark;
      var sequenceNumber = delivery.seq;

      if (messageIDs) {
        messageIDs.forEach(function(messageID) {
          console.log("Received delivery confirmation for message ID: %s", 
            messageID);
        });
      }

      console.log("All message before %d were delivered.", watermark);
    }


    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message. 
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     * 
     */
    function receivedPostback(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;
      var timeOfPostback = event.timestamp;

      // The 'payload' param is a developer-defined field which is set in a postback 
      // button for Structured Messages. 
      var payload = event.postback.payload;

      console.log("Received postback for user %d and page %d with payload '%s' " + 
        "at %d", senderID, recipientID, payload, timeOfPostback);

      // When a postback is called, we'll send a message back to the sender to 
      // let them know it was successful
      sendMessage.sendTextMessage(senderID, "Postback called");
    }

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     * 
     */
    function receivedMessageRead(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;

      // All messages before watermark (a timestamp) or sequence have been seen.
      var watermark = event.read.watermark;
      var sequenceNumber = event.read.seq;

      console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
    }

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     * 
     */
    function receivedAccountLink(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;

      var status = event.account_linking.status;
      var authCode = event.account_linking.authorization_code;

      console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
    }

    /*
     * Turn typing indicator on
     *
     */
    function sendTypingOn(recipientId) {
      console.log("Turning typing indicator on");

      var messageData = {
        recipient: {
          id: recipientId
        },
        sender_action: "typing_on"
      };

      callSendAPI(messageData);
    }

    /*
     * Turn typing indicator off
     *
     */
    function sendTypingOff(recipientId) {
      console.log("Turning typing indicator off");

      var messageData = {
        recipient: {
          id: recipientId
        },
        sender_action: "typing_off"
      };

      callSendAPI(messageData);
    }

    /*
     * Send a message with the account linking call-to-action
     *
     */
    function sendAccountLinking(recipientId) {
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: "Welcome. Link your account.",
              buttons:[{
                type: "account_link",
                url: SERVER_URL + "/authorize"
              }]
            }
          }
        }
      };  

      callSendAPI(messageData);
    }



    /*
     * Call the Send API. The message data goes in the body. If successful, we'll 
     * get the message id in a response 
     *
     */
    function callSendAPI(messageData) {
      request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var recipientId = body.recipient_id;
          var messageId = body.message_id;

          if (messageId) {
            console.log("Successfully sent message with id %s to recipient %s", 
              messageId, recipientId);
          } else {
          console.log("Successfully called Send API for recipient %s", 
            recipientId);
          }
        } else {
          console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
      });  
    }



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

};
