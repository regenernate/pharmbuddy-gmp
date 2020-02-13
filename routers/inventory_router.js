
module.exports.base_route_path = "inventory";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  //this if/then situation may not last if this router requires more routes
  if( !path || !path.length || path[0] == "" || path[0] == "list" ){
    let ingredients = inventory.getIngredientList();
    let batches = inventory.getBatchList();
    return bro.get( true, renderTemplate( req, pages.inventory_list, {ingredients:ingredients, batches:batches } ) );
  }else if( path[0] == "advance" ){
    let rd, rp, key, lot_number=false;
    if( req.body && req.body.key ){
      key = req.body.key;
      lot_number = req.body.lot_number;
      rp = req.body.responsible_party;
      rd = req.body.registered_device;
    }
    let next_lot = inventory.advanceIngredientLot( { key:key, responsible_party:rp, registered_device:rd, lot_number:lot_number } );
    return bro.get( true, renderData( next_lot ));
  }else return bro.get( true, renderError( req, "Unrecognized route."));
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderError, renderTemplate, renderData } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const inventory = require('../services/inventory_manager');

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { inventory_list:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
