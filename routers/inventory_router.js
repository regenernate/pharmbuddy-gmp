
module.exports.base_route_path = "inventory";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  //this if/then situation may not last if this router requires more routes
  if( !path || !path.length || path[0] == "" || path[0] == "list" ){
    let ingredients = await inventory.getIngredientList( true );
    let batches = await inventory.getBatchList();
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
  }else if( path[0] == "update" ){
    if( req.body ){
      let r;
      if( req.body.type == 'fse' ){
        r = await inventory.updateFSEMass( req.body.batch_id, req.body.new_mass );
        r = { success:r, new_mass:req.body.new_mass };
      }else if( req.body._id ){
        r = await inventory.updateVolumeById( req.body._id, req.body.new_volume );
        r = { success:r, new_volume:req.body.new_volume };
      }
      return bro.get( true, renderData( r ) );
    }else{
      return bro.get( true, renderData( {success:false} ) );
    }
  }else if( path[0] == "retire" ){
    let s = false;
    if( req.body ){
      if( req.body.type == 'fse' ){
        s = await inventory.retireFSEBatch( req.body.batch_id );
      }else{
        s = await inventory.retireIngredient( req.body._id, (req.body.product_type) ? req.body.product_type : null );
      }
    }
    return bro.get( true, renderData( {success:s} ) );
  }else if( path[0] == "unretire" ){
    let s = false;
    if( req.body ){
      if( req.body.type == 'fse' ){
        s = await inventory.unretireFSEBatch( req.body.batch_id );
      }else{
        s = await inventory.unretireIngredient( req.body._id, (req.body.product_type) ? req.body.product_type : null )
      }
    }
    return bro.get( true, renderData( {success:s} ) );
  }else if( path[0] == "fse" ){
    if( req.body ){
      //add fse lot here
    }
    let batch_id = path[1]; //get batch_id which should be after second /
    let fnd = await inventory.getFSELot(batch_id);
    if( fnd ) return bro.get( true, renderTemplate( req, pages.fse_item, {item:fnd}));
    else return bro.get( true, renderError(req, 'Unrecognized Full Spectrum Extract id. Try selecting a batch from the <a href="/inventory">inventory list</a>.'));
  }else if( path[0] == "delete" ){
    if( req.body ){
      let rmd = await inventory.deleteInventoryItem( req.body._id );
      if( rmd === true ) return bro.redirect( '/inventory/' + req.body.key );
      else return bro.get( true, renderError(req, rmd) );
    }else return bro.get( true, renderError(req, "You can't delete an item without sending an _id. Visit a specific inventory item page to find the delete buttons."));
  }else{  //assume this is an attempt to see a specific inventory item by key
    if( req.body ){ //if posted values, assume adding lot
      let ai = await inventory.addIngredientLot( req.body.key, req.body );
      if( ai ) return bro.redirect('/inventory/' + req.body.key); //redirect here to avoid reposting
      else return bro.get( true, renderError(req, "This item wasn't added to inventory!"));
    }
    let key = path[0].toLowerCase();
    let fnd = await inventory.getAllInventoryFor( key );
    if( fnd ){
      let ai=[], ri=[], rtn={};
      if( fnd.length ){
        for( let i=0; i<fnd.length; i++ ){
          if( fnd[i] && fnd[i].retired_date ) ri.push( fnd[i] );
          else ai.push( fnd[i] );
        }
        rtn.item = {key:key, label:fnd[0].label};
      }else{ //tracked inventory item but not items currently in inventory
        rtn.item = {key:key, label:await inventory.getIngredientLabel( key )};
      }
      if( ai.length ) rtn.active_lots = ai;
      if( ri.length ) rtn.retired_lots = ri;
      return bro.get( true, renderTemplate( req, pages.inventory_item, rtn) );
    }else return bro.get( true, renderError( req, "You are looking for an ingredient we don't currently use :: " + key + ". Try starting from <a href='/inventory/list'>the inventory list</a>." ) );
  }
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderError, renderTemplate, renderData } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const inventory = require('../services/inventory_manager');

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { inventory_list:1, inventory_item:1, fse_item:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
