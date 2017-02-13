 // app/routes.js

// grab the nerd model we just created
var Outfit = require('./models/Outfit');

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
              receivedMessage(messagingEvent);
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
      sendTextMessage(senderID, "Authentication successful");
    }

    /*
     * Message Event
     *
     * This event is called when a message is sent to your page. The 'message' 
     * object format can vary depending on the kind of message that was received.
     * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
     *
     * For this example, we're going to echo any text that we get. If we get some 
     * special keywords ('button', 'generic', 'receipt'), then we'll send back
     * examples of those bubbles to illustrate the special message bubbles we've 
     * created. If we receive a message with an attachment (image, video, audio), 
     * then we'll simply confirm that we've received the attachment.
     * 
     */
    function receivedMessage(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;
      var timeOfMessage = event.timestamp;
      var message = event.message;

      console.log("Received message for user %d and page %d at %d with message:", 
        senderID, recipientID, timeOfMessage);
      console.log(JSON.stringify(message));

      var isEcho = message.is_echo;
      var messageId = message.mid;
      var appId = message.app_id;
      var metadata = message.metadata;

      // You may get a text or attachment but not both
      var messageText = message.text;
      var messageAttachments = message.attachments;
      var quickReply = message.quick_reply;

      if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s", 
          messageId, appId, metadata);
        return;
      } else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
          messageId, quickReplyPayload);

        sendTextMessage(senderID, "Quick reply tapped");
        return;
      }

      if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {

          case 'is the l train running':
            //somecode

            sendTextMessage(senderID, "The Fucking Status");
            scrapeIt("http://subwaystats.com/status-L-train", {
                title: "title",
                desc: ".header h2",
                currentStatus: "#content > div.titleStripe > div > div:nth-child(1) > div.col-xs-12.col-sm-7.col-md-7.col-lg-7 > div > div > h2"
            }).then(page => {
                console.log(page);
                sendTextMessage(senderID, page.currentStatus);
            });


            break;

          case 'image':
            sendImageMessage(senderID);
            break;

          case 'gif':
            sendGifMessage(senderID);
            break;

          case 'audio':
            sendAudioMessage(senderID);
            break;

          case 'video':
            sendVideoMessage(senderID);
            break;

          case 'file':
            sendFileMessage(senderID);
            break;

          case 'button':
            sendButtonMessage(senderID);
            break;

          case 'generic':
            sendGenericMessage(senderID);
            break;

          case 'receipt':
            sendReceiptMessage(senderID);
            break;

          case 'quick reply':
            sendQuickReply(senderID);
            break;        

          case 'read receipt':
            sendReadReceipt(senderID);
            break;        

          case 'typing on':
            sendTypingOn(senderID);
            break;        

          case 'typing off':
            sendTypingOff(senderID);
            break;        

          case 'account linking':
            sendAccountLinking(senderID);
            break;

          case 'hey':
            sendHiSanam(senderID);
          break;

          case 'Hey':
            sendHiSanam(senderID);
          break;

          default:
            sendTextMessage(senderID, messageText);
        }
      } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
      }
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
      sendTextMessage(senderID, "Postback called");
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
