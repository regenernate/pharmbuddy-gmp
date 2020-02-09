
module.exports.base_route_path = "inventory";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( !auth_check ) return auth_check;
  let inv = getInventoryList();
  //this if/then situation may not last if this router requires more routes
  if( !path || !path.length || path[0] == "" || path[0] == "list" ){
    return bro.get( true, renderTemplate( req, pages.inventory_list, {inventory:inv} ) );
  }else return bro.get( true, renderError( req, "Unrecognized route."));
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun } = require('../services/lots/lots');
const wpe_batches = require('../services/batches/batches');
const { getInventoryList } = require('../services/inventory/inventory');

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { inventory_list:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
