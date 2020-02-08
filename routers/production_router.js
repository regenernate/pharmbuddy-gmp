/*********

PURPOSE: To manage request flow for creating product runs

**********/


module.exports.base_route_path = "production";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( !auth_check ) return auth_check;

  //this if/then situation may not last if this router requires more routes
  if( !path || !path.length || path[0] == "" || path[0] == "production_run" ){
    return bro.get( true, renderTemplate( req, pages.make_production_run ) );
  }else if( path[0] == "make_sublingual" ){
    return bro.get( true, renderTemplate( req, pages.sublingual_run ) );
  }else if( path[0] == "make_salve" ){
    return bro.get( true, renderTemplate( req, pages.salve_run ) );
  }else if( path[0] == "calculate_ingredients" || path[0] == "recalculate" ){
    let f;
    try{
      if( !req.body ) throw new Error("You must send appropriate data to the formulator! Post body was undefined.");

      if( path[0] == 'recalculate' ){
        f = getCachedFormulation( req.body.formulation_cache_id );
        //advance limiting ingredient lot number
        advanceLimitingIngredients( f.formulation );
        deleteCachedFormulation( req.body.formulation_cache_id );
        req.body = f.request;
      }

      //get the per unit formula, assumes 1 oz currently
      let product_type = req.body.product_type;
      if( !product_type ) throw new Error("You must send a product type.");
      ///get fshe batch public object from inventory to send to calculator
      let wpe = wpe_batches.getBatchForProduct( product_type ); //return obj has id, percent_cbd, available_mass
      let quantity_requested = req.body.quantity;
      let product_ingredients = getIngredientsFromRequest( product_type, req.body );
      f = await getFormulation( product_type, product_ingredients, req.body.strength, wpe, quantity_requested );

      if( f.max_units < quantity_requested ){
        console.log(" can only make " + f.max_units + " rather than " + quantity_requested + " limited by " + f.limiting_ingredient );
      }

      f.requested_units=quantity_requested;
      f.product_type = product_type; //pass product type through to next views
      let mult;
      for( let i in f.formulation ){
        if( i == WPE ) mult = 1000;
        mult = 10;
        f.formulation[i].total_amount = Math.ceil( f.formulation[i].quantity * f.max_units * 100 ) / 100;
        f.formulation[i].type = f.formulation[i].type.split("_").join(" ");
      }
      if( f.limiting_ingredient ) f.limiting_ingredient = f.limiting_ingredient.split("_").join(" ");
      console.log(f);
    }catch(err){
      console.log("production_router error :: ", err.message);
      return bro.get( true, renderError( req, "production router :: " + err.message, 'logged_out' ) );
    }
    //cache formula instead of passing it back and forth in forms
    f.request = req.body;
    f.cache_id = cacheFormulation( f );
    return bro.get( true, renderTemplate( req, pages.calculate_ingredients, f ) );
  }else if( path[0] == "create_run" ){
    let f = getCachedFormulation( req.body.formulation_cache_id );
    if( !f ) return bro.get(true, renderError( req, "This run is no longer cached so you'll have to start over." ) );
    //make this run - get lot numbers for all ingrdients first
    let lot_numbers = [];
    for( let i in f.formulation ){
      lot_numbers.push( {ingredient:f.formulation[i].type, lot_number:f.formulation[i].lot_number, amount:f.formulation[i].total_amount} );
    }
    //create the run -- this returns { run_id:{id}, lot_id:{id} }
    let run_id = lots.createRun( f.product_type, f.request.strength, lot_numbers, f.max_units );

    //get product batch id here ...
    f.product_batch_id = wpe_batches.getProductBatchId( f.product_type, f.formulation[ WPE ].lot_number, f.request.strength );



    if( !run_id ) return bro.get( true, renderError( req, "The run you requested could not be created." ) );
    //pullInventory for this run
    if( !pullInventory( f.formulation ) ){
      //maybe delete run??
      return bro.get( true, renderError( req, "The inventory could not be pulled based on the formulation requested.") );
    }
    deleteCachedFormulation( req.body.formulation_cache_id );
    f.lot_id = run_id.lot_id;
    f.run_id = run_id.run_id;
    console.log(f);
    return bro.get( true, renderTemplate( req, pages.confirm_run, f ) );
  }else{
    return bro.get( true, renderError( req, "This route doesn't exist.", 'logged_out' ) );
  }
}

async function getFormulation( product, ingredients, strength, wpe_batch, units_requested ){

  let formulator = formulators[ product ];
  if(!formulator) throw new Error('production_router.error in getFormulation :: No match for product type :: ', product );
  let formulation = await formulator.calculateIngredients( ingredients, strength, wpe_batch ); //r.formula = { 'carrier':21.53535, etc. }
  //how much of each thing do we need?
  let max_units = units_requested;
  let item_lot;
  let limiting_ingredient=null;
  for( let i in formulation ){
    //get max number of units we can make from current inventory lots
    if( i == WPE ){
      item_lot = await wpe_batches.getUnitsAvailable( formulation[i].id, formulation[i].quantity );
      //adding type here because it is only for display purposes, not persisted to any data
      formulation[i].type = WPE_TYPE;
    }else{
      item_lot = await inventory.getUnitsAvailable( formulation[i].type, formulation[i].quantity );
    }
    formulation[i].max_units = item_lot.max_units;
    formulation[i].lot_number = item_lot.lot_number;
    if( formulation[i].max_units < max_units ){
      max_units = formulation[i].max_units;
      limiting_ingredient = formulation[i].type;
    }
  }
  return {formulation:formulation, max_units:max_units, limiting_ingredient:limiting_ingredient };
}

function getIngredientsFromRequest( product_type, req_body ){
  if( product_type == SUBLINGUAL ) return {carrier:req_body.carrier, flavoring:req_body.flavoring};
  else if( product_type == SALVE ) return {essential_oils:req_body.essential_oils};
}

function pullInventory( ingredients ){
  for( let i in ingredients ){
    if( i == WPE ) wpe_batches.pullBatch( ingredients[i].id, ingredients[i].total_amount );
    else inventory.pullInventory( ingredients[i].type, ingredients[i].total_amount );
  }
  return true;
}

//switch to next batch on anything that can make less than "unit_count" units
function advanceLimitingIngredients( ingredients, unit_count ){
  if(!unit_count) unit_count = 0;
  for( let i in ingredients ){
    if( ingredients[i].max_units <= unit_count ){
      if( i == WPE ) wpe_batches.retireBatch( ingredients[i].id );
      else inventory.retireInventory( ingredients[i].type, ingredients[i].lot_number );
    }
  }
  return true;
}

var formulation_cache = {};
var cache_id = 0;

function cacheFormulation( formulation ){
  formulation_cache[ cache_id ] = formulation;
  cache_id++;
  return cache_id-1;
}

function getCachedFormulation( formulation_id ){
  return formulation_cache[formulation_id];
}

function deleteCachedFormulation( formulation_id ){
  delete formulation_cache[ formulation_id ];
}

const WPE = "wpe";
const WPE_TYPE = "whole plant extract";
const SUBLINGUAL = "sublingual";
const SALVE = "salve";

const fs = require('fs');
const bro = require('../server/bro');
const sessions = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const {renderError, renderTemplate} = require('../tools/rendering/render_util');
const wpe_batches = require('../services/batches/batches');
const inventory = require('../services/inventory/inventory');
const lots = require('../services/lots/lots');

var formulators = {};
formulators[SUBLINGUAL] = require('../services/formulations/formulator_sublingual');
formulators[SALVE] = require('../services/formulations/formulator_salve' );

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { make_production_run:1, salve_run:1, sublingual_run:1, calculate_ingredients:1, confirm_run:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();

//validation methods simply confirm value sent is ok and then either push errors onto error stack and return default value OR return valid value as sent
function validateQuantity( qty, errors ){
  if( !qty ) qty = default_quantity;
  if( isNaN(qty) || qty < min_quantity || qty > max_quantity ){
    errors.push( quantity_error + " // value sent was : " + qty );
    return default_quantity;
  }else {
    return qty;
  }
}
