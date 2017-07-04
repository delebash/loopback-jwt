let jwt = require('jsonwebtoken');
let config = require('../../server/config.json');
let app = require('../../server/server.js');

module.exports = function (user) {

  // // provide own createAccessToken to create JWTs
  user.prototype.createAccessToken = function (ttl, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }

    // token payload
    let payload = {};
    for (let key in config.jwt.properties) {
      payload[key] = this[config.jwt.properties[key]];
    }

    payload.iss = "Ageektech";
    payload.sub = "Loopback api key";


    let secret = config.jwt.client_secret;
    let at_ttl = config.jwt.access_token_ttl;
    let rt_ttl = config.jwt.refresh_token_ttl;

    // response body
    let response = {
      user_id: this.id,
      access_token: jwt.sign(payload, secret, {expiresIn: at_ttl})
    };

    if (rt_ttl) {
      response.refresh_token = jwt.sign(payload, secret, {expiresIn: rt_ttl});
    }

    if (typeof cb !== 'function') return response;

    return cb(null, response);
  }

};
