
const bro = require('../server/bro');

module.exports.base_route_path = "static";

//manage requests
module.exports.router = async function( req, res, path ) {
  if(!path) path = [];
  if( !getRegisteredDevice(req) ) return bro.redirect( "/" + reg_path + "/" );
  if( getResponsibleParty( req ) ){
    let rtn;
    if( path[0] == "logout" ){
      clearResponsibleParty( res ); //expire the responsible party cookie by setting max-age to 1 second
      return bro.get( true, renderStatic( req, pages.logout ) );
    }else{
      return bro.redirect("/" + prod_path + "/"); //already logged in and not trying to log out so go on to production
    }
  }
  if( path[0] == "login" ){
    //if no posted values or no "responsible_party" posted, show login page
    if(!req.body || !req.body.responsible_party ) return bro.get( true, renderStatic( req, pages.login ) );
    else{ //log in user
      if(!setResponsibleParty( res, req.body.responsible_party ) ) return bro.get( true, renderError(req, "Could not set cookie for responsible_party.") );
      return bro.redirect( "/" + prod_path + "/" );
    }
  }else return bro.redirect("/login/"); //otherwise redirect to login
}

//external requirements
const {base_route_path : reg_path} = require('./registration_router');
const {base_route_path : prod_path} = require('./production_router');

const {getResponsibleParty, setResponsibleParty, getRegisteredDevice, clearResponsibleParty} = require('../tools/sessions/session_util');
const {renderStatic, renderError} = require('../tools/rendering/render_util');

function initialize(){
  //load view templates
  //use filesys_util to generate paths and load them from the pages object
  let fsu = require( "../tools/filesys/filesys_util");
  pages = fsu.loadFiles( fsu.generatePaths( { login:1, logout:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
