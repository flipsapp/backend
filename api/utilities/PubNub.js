var PubNub = require('pubnub').init({
  publish_key   : process.env.PUBNUB_PUB_KEY,
  subscribe_key : process.env.PUBNUB_SUB_KEY
});

module.exports = PubNub;