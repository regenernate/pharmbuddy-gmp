const REQ_PROPNAME = "session_util";

//externally available method to get the registered device from a request
module.exports.getRegisteredDevice = function( req ){
  let rp;
  if( req.hasOwnProperty( REQ_PROPNAME ) ) rp = req[ REQ_PROPNAME ];
  else rp = {};
  if( rp.device_name ) return rp.device_name;
  else{
    let rc = getCookie( req, rd_cookie_name );
    if( rc ){
      rp.device_name = JSON.parse( rc ).device_name;
      req[ REQ_PROPNAME ] = rp;
      return rp.device_name;
    }else return false;
  }
}

module.exports.setRegisteredDevice = function( res, device_name ){
  return setCookie( res, rd_cookie_name, JSON.stringify({ device_name:device_name, registration_date:moment().format('x') }), rd_max_age );
}

module.exports.clearRegisteredDevice = function( res ){
    return setCookie( res, rd_cookie_name, "expired", 1 );
}

module.exports.getResponsibleParty = function( req ){
  let rp;
  if( req.hasOwnProperty( REQ_PROPNAME ) ) rp = req[ REQ_PROPNAME ];
  else rp = {};
  if( rp.responsible_party ) return rp.responsible_party;
  else{
    rp.responsible_party = getCookie( req, rp_cookie_name );
    req[ REQ_PROPNAME ] = rp;
    return rp.responsible_party;
  }
}

module.exports.setResponsibleParty = function( res, rp_name ){
  return setCookie( res, rp_cookie_name, rp_name, rp_max_age );
}

module.exports.clearResponsibleParty = function( res ){
  return setCookie( res, rp_cookie_name, "expired", 1 )
}

//registered device constants
const rd_cookie_name = "registration";
const rd_max_age = 60*60*24*365*5; //5 years

//responsible party constants
const rp_cookie_name = "responsible_party";
const rp_max_age = 60*60*8; //4 hours expiration

//external dependencies
const moment = require('moment');
const {setCookie, getCookie} = require('../cookies/cookie_util');
