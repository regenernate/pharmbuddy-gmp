
module.exports.base_route_path = "static";

const fs = require('fs');
const bro = require('../server/bro');
const template_manager = require('../views/template_manager');
const {getCookie} = require('../tools/cookies/cookie_util');

const view_extension = ".handlebars";

//This is a hash of which files from the "mains" folder to load as static views
var statics = { login:1 };

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

//manage requests
module.exports.router = async function( req, res, path ) {
  if(!path) path = [];
  console.log(getCookie(req, "registration"));
  if( pages.hasOwnProperty( path[0] ) ){
    //serve page
    return bro.get( true, template_manager.executeTemplate( null, pages[ path[0] ] , 'logged_out') );
  }
  else
  {
    //serve 404
    return bro.get( true, template_manager.executeTemplate( null, "This route doesn't exist yet.", 'logged_out' ) );
  }
}
