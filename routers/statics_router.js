
module.exports.base_route_path = "static";

module.exports.getResponsibleParty = function( req ){
  let rc = getCookie( req, cookie_name );
  if( !rc ) return false;
  else return rc;
}

//manage requests
module.exports.router = async function( req, res, path ) {
  if(!path) path = [];
  let rd = getRegisteredDevice(req);
  if( !rd ) return bro.get( true, null, null, "/" + reg_path + "/" );
  if( getCookie( req, cookie_name ) ){
    if( path[0] == "logout" ){
      setCookie( res, cookie_name, "expired", 1 ); //expire the responsible party cookie
      return bro.get( true, template_manager.executeTemplate( null, pages.logout, "logged_out" ) );
    }else{
      return bro.get( true, null, null, "/" + prod_path + "/"); //already logged in and not trying to log out so go on to production
    }
  }
  if( path[0] == "login" ){
    //if no posted values or no "responsible_party" posted, show login page
    if(!req.body || !req.body.responsible_party ) return bro.get( true, template_manager.executeTemplate( null, pages[ path[0] ] , 'logged_out') );
    else{ //log in user
      if(!setCookie( res, cookie_name, req.body.responsible_party, max_age )) return bro.get( true, null, "Could not set cookie for responsible_party.");
      return bro.get( true, null, null, "/" + prod_path + "/" );
    }
  }
  else if( path[0] == "logout" ){
    return bro.get( true, null, null, "/login/");
  }else{
    //serve 404
    return bro.get( true, template_manager.executeTemplate( null, "This route doesn't exist yet.", 'logged_out' ) );
  }
}

const cookie_name = "responsible_party";
const max_age = 60*60*8; //4 hours expiration

const fs = require('fs');
const {base_route_path : reg_path, getRegisteredDevice} = require('./registration_router');
const {base_route_path : prod_path} = require('./formulating_router');
const bro = require('../server/bro');
const template_manager = require('../views/template_manager');
const {getCookie, setCookie} = require('../tools/cookies/cookie_util');

const view_extension = ".handlebars";

//This is a hash of which files from the "mains" folder to load as static views
var statics = { login:1, logout:1 };

//This will hold the cached pages once they load
var pages = {};

//LOAD THE VIEWS
const dir = "./views/mains/";

for( let i in statics ){
  loadFile(i + view_extension, dir);
}

function loadFile( name, path ){
  pages[ name.split('.')[0] ] = fs.readFileSync( path + name, 'utf-8' );
}
