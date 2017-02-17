const config = require('config');

const request = require('request');

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


module.exports = {
  sendTextMessage: function(recipientId, messageText) {
    var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText,
          metadata: "DEVELOPER_DEFINED_METADATA"
        }
      };

      callSendAPI(messageData);
    },
    /*
     * Send an image using the Send API.
     *
     */
  sendImageMessage: function (recipientId) {
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "image",
            payload: {
              url: SERVER_URL + "/assets/rift.png"
            }
          }
        }
      };

      callSendAPI(messageData);
  },

      /*
     * Send a Gif using the Send API.
     *
     */
  sendGifMessage: function (recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: SERVER_URL + "/assets/instagram_logo.gif"
          }
        }
      }
    };

    callSendAPI(messageData);
  },

  /*
   * Send audio using the Send API.
   *
   */
  sendAudioMessage: function (recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "audio",
          payload: {
            url: SERVER_URL + "/assets/sample.mp3"
          }
        }
      }
    };

    callSendAPI(messageData);
  },

  /*
   * Send a video using the Send API.
   *
   */
  sendVideoMessage: function (recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "video",
          payload: {
            url: SERVER_URL + "/assets/allofus480.mov"
          }
        }
      }
    };

    callSendAPI(messageData);
  },

  /*
   * Send a video using the Send API.
   *
   */
  sendFileMessage: function (recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "file",
          payload: {
            url: SERVER_URL + "/assets/test.txt"
          }
        }
      }
    };

    callSendAPI(messageData);
  }
};