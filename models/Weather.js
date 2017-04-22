
var mongoose = require('mongoose');

var weatherSchema = mongoose.Schema({
  
  time: Number,
  summary: String,
  icon: String,
  sunriseTime: Number,
  sunsetTime: Number,
  moonPhase: Number,
  precipIntensity: Number,
  precipIntensityMax: Number,
  precipIntensityMaxTime: Number,
  precipProbability: Number,
  precipType: String,
  temperatureMin: Number,
  temperatureMinTime: Number,
  temperatureMax: Number,
  temperatureMaxTime: Number,
  apparentTemperatureMin: Number,
  apparentTemperatureMinTime: Number,
  apparentTemperatureMax: Number,
  apparentTemperatureMaxTime: Number,
  dewPoint: Number,
  humidity: Number,
  windSpeed: Number,
  windBearing: Number,
  visibility: Number,
  cloudCover: Number,
  pressure: Number,
  ozone: Number

});

module.exports = mongoose.model('weathers', weatherSchema);