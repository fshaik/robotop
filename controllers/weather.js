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
    
 const 
  config = require('config'),
  forecast = require('forecast'),
  mongoose = require('mongoose');
  mongoose.Promise = global.Promise;
  Weather = require('../models/Weather');
  SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');
  request = require('request');


module.exports = { 

  checkWeather: function(resolve, coor) {

    console.log("Checking Weather...")

    var today = 0;

    var forecast = new Forecast({
      service: 'darksky',
      key: '6ee8cd767b474ad54e05898fb5d5e7ac',
      units: 'fahrenheit',
      cache: true,
      ttl: {
        minutes: 27,
        seconds: 45
      }
    });

    forecast.get(coor, function(err, weather) {
      if(err) return console.dir(err);


       resolve(weather.daily.data[0]);


    });

  },

  getYesterdayWeather: function (todaysTimestamp){

    var yesterdaysDate = new Date(todaysTimestamp*1000);
    todaysdate = yesterdaysDate.getTime()/1000
    yesterdaysDate.setDate(yesterdaysDate.getDate() - 1);
    var yesterdaysTimeStamp = yesterdaysDate.getTime()/1000

    var timestamps = [yesterdaysTimeStamp, todaysdate]

    return new Promise ((resolve, reject) => {

      request({
        url: SERVER_URL + 'api/weather',
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: timestamps
      },
      function(err, res, body){
        if(err) { 
           console.log("Error in getYesterdayWeather");
           reject(err);
        }

        resolve(body);

      });

    });



  },

  compareWeathers: function(y, t) {

    var difference = Math.abs(y.temperatureMin - t.temperatureMin)

    if ( difference > 2) {
      return difference;

    }
    else 
      return false

  }


};