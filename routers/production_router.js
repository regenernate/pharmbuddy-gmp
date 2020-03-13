/*********

PURPOSE: To manage request flow for creating product runs

**********/


module.exports.base_route_path = "production";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  //this if/then situation may not last if this router requires more routes
  if( !path || !path.length || path[0] == "" || path[0] == "production_run" ){
    let pt = inventory.getProductTypes();
    return bro.get( true, renderTemplate( req, pages.make_production_run, {product_types:pt} ) );
  }else if( path[0].split("_")[0] == "make" ){
    let product_type = path[0].split("_")[1];
    let pt = inventory.getProduct( product_type ); //get the product object { key: , label: } for this product
    let ing = inventory.getIngredientsFor( product_type );
    return bro.get( true, renderTemplate( req, pages[product_type + "_run"], {product_type:pt, options:ing} ) );
  }else if( path[0] == "calculate_ingredients" || path[0] == "advance_lot"){
    let advanced_lot, formula;
    try{
      if( !req.body ) throw new Error("You must send appropriate data to the formulator! Post body was undefined.");

      if( path[0] == 'advance_lot' ){
        if( !req.body.limiting_type ) throw new Error( "You can't recalculate unless you advance")
        let advanced_lot;
        if( req.body.limiting_type == WPE ){
          advanced_lot = inventory.advanceWPELot( {key:req.body.limiting_key, responsible_party:sessions.getResponsibleParty(req), registered_device:sessions.getRegisteredDevice(req) }, req.body.product_type );
        }else{
          advanced_lot = inventory.advanceIngredientLot( {key:req.body.limiting_key, lot_number:req.body.limiting_lot, responsible_party:sessions.getResponsibleParty(req), registered_device:sessions.getRegisteredDevice(req) } );
        }
        if( !advanced_lot ) throw new Error("Inventory could not be advanced, probably because I ain't got no " + req.body.limiting_key + ".");
        if( !advanced_lot.lot_number ) throw new Error("Unfortunately there are no more lots of " + advanced_lot.label + "." );
      }

      //get which whole plant extract batch to use
      let wpe_batch;
      if( req.body.wpe_key ) wpe_batch = inventory.getWPELot( req.body.wpe_key );
      else wpe_batch = inventory.getBatchForProduct( req.body.product_type ); //get correct wpe batch object { key: , label: , percent_cbd: }
      //get formulator to use based on product type being made
      let formulator = formulators[ req.body.product_type ];
      if(!formulator) throw new Error( "No formulator exists for " + req.body.product_type );
      formula = await formulator.createFormula( req.body, wpe_batch );

      let ingredient_lot, max_units, amount_needed;
      max_units = inventory.calculateWPEMaxUnits( formula.wpe.key, formula.wpe.amount );
      formula.wpe.lot_number = inventory.getWPELot( formula.wpe.key ).lot_number;
      formula.wpe.max_units = max_units.max_units;
      formula.wpe.warning_level = max_units.warning_level;
      formula.wpe.label = inventory.getWPELabel( formula.wpe.key );
      let limiting_ingredient = formula.wpe;
      let limiting_type = "wpe";
      let warning_level = formula.wpe.warning_level;
      for( let i in formula.ingredients ){
        formula.ingredients[i].lot_number = inventory.getIngredientLot( formula.ingredients[i].key ).lot_number;
        if( formula.ingredients[i].units == 'g' ) max_units = inventory.calculateMaxUnitsByMass( formula.ingredients[i].key, formula.ingredients[i].lot_number, formula.ingredients[i].amount );
        else{
          amount_needed = formula.ingredients[i].amount;
          if( formula.ingredients[i].units == 'oz' ) amount_needed *= MILS_PER_OZ;
          max_units = inventory.calculateMaxUnitsByVolume( formula.ingredients[i].key, formula.ingredients[i].lot_number, amount_needed );
        }
        formula.ingredients[i].max_units = max_units.max_units;
        formula.ingredients[i].warning_level = max_units.warning_level;
        formula.ingredients[i].label = inventory.getIngredientLabel( formula.ingredients[i].key );
        if( max_units.max_units < limiting_ingredient.max_units ){
          limiting_ingredient = formula.ingredients[i];
          limiting_type = "ingredient";
        }
        if( formula.ingredients[i].warning_level ) warning_level = true;
      }
      formula.limit = { warning_level:warning_level, type:limiting_type, item:limiting_ingredient };
      if( advanced_lot ){
        formula.message = "Success. This formulation is using the next lot of " + inventory.getIngredientLabel(advanced_lot.key) + ".";
      }
    }catch(err){
      console.log("production_router error :: ", err.message);
      return bro.get( true, renderError( req, "production router :: " + err.message, 'logged_out' ) );
    }
    let form_req = {};
    for( let i in req.body ){
      if( i.indexOf('limit') < 0) form_req[ i ] = req.body[i];
    }
    formula.request = form_req;
//    formula.cache_id = cacheFormulation( f );
    console.log("******* FORMULA REQUESTED ********")
    console.log(formula);
    console.log("******* END FORMULA REQUESTED ********")
    return bro.get( true, renderTemplate( req, pages.calculate_ingredients, formula ) );
  }else if( path[0] == "create_run" ){
    let wpe_batch;
    try{
      if( req.body.wpe_key ) wpe_batch = inventory.getWPELot( req.body.wpe_key );
      else wpe_batch = inventory.getBatchForProduct( req.body.product_type ); //get correct wpe batch object { key: , label: , percent_cbd: }
      //get formulator to use based on product type being made
      let formulator = formulators[ req.body.product_type ];
      if(!formulator) throw new Error( "No formulator exists for " + req.body.product_type );
      formula = await formulator.createFormula( req.body, wpe_batch );
      let units_to_make = req.body.units_requested;
      formula.wpe.total_amount = precisify(units_to_make * formula.wpe.amount);
      formula.wpe.lot_number = inventory.getWPELot( formula.wpe.key ).lot_number;
      formula.wpe.label = inventory.getWPELabel( formula.wpe.key );
      for( let i in formula.ingredients ){
        formula.ingredients[i].lot_number = inventory.getIngredientLot( formula.ingredients[i].key ).lot_number;
        formula.ingredients[i].total_amount = precisify( units_to_make * formula.ingredients[i].amount );
        formula.ingredients[i].label = inventory.getIngredientLabel( formula.ingredients[i].key );
      }
      //create the run -- this returns { run_id:{id}, lot_id:{id} }
      let run_id = lots.createRun( req.body.product_type, req.body.strength, req.body.units_requested, formula.ingredients, formula.wpe );
      if( !run_id ) return bro.get( true, renderError( req, "The run you requested could not be created." ) );

      formula.product = run_id;
      //get product batch id here ...
      formula.product.batch_id = inventory.getProductBatchId( req.body.product_type, formula[ WPE ].lot_number, req.body.strength );

      //pullInventory for this run
      if( !inventory.pullIngredientsForRun( formula.ingredients, formula.wpe ) ){
        //maybe delete run??
        return bro.get( true, renderError( req, "The inventory could not be pulled based on the formulation requested.") );
      }
      //all was successful!
      formula.units_made = units_to_make;
      formula.strength = req.body.strength;
      formula.product_type = req.body.product_type;
      console.log("production_router :: ", formula);
      return bro.get( true, renderTemplate( req, pages.confirm_run, formula ) );
    }catch(e){
      return bro.get( true, renderError( req, e.message ) );
    }
  }else{
    return bro.get( true, renderError( req, "This route doesn't exist.", 'logged_out' ) );
  }
}

/*async function getFormulation( product, ingredients, strength, wpe_batch, units_requested ){

  let formulator = formulators[ product ];
  if(!formulator) throw new Error('production_router.error in getFormulation :: No match for product type :: ', product );
  let formulation = await formulator.calculateIngredients( ingredients, strength, wpe_batch ); //r.formula = { 'carrier':21.53535, etc. }
  //how much of each thing do we need?
  let max_units = units_requested;
  let item_lot;
  let limiting_ingredient=null;
  for( let i in formulation.base ){
    item_lot = await inventory.getUnitsAvailable( formulation.base[i].key, formulation.base[i].quantity );
    formulation.base[i].name = inventory.getItemName( formulation.base[i].key );
    formulation.base[i].inventory = item_lot;
    if( item_lot.max_units < max_units ){
      max_units = item_lot.max_units;
      limiting_ingredient = formulation.base[i].key;
    }
  }
  //get max number of units we can make from current inventory lots
  formulation[WPE].name = "Whole Plant Extract";
  formulation[WPE].inventory = wpe_batches.getUnitsAvailable( formulation[WPE].key, formulation[WPE].quantity );
  if( formulation[WPE].inventory.max_units < max_units ){
    max_units = formulation[WPE].inventory.max_units;
    limiting_ingredient = formulation[WPE].key;
  }

    //adding type here because it is only for display purposes, not persisted to any data
  console.log( "getFormulation *****" );
  console.log(formulation);
  return {formulation:formulation, max_units:max_units, limiting_ingredient:limiting_ingredient };
}

function getIngredientsFromRequest( product_type, req_body ){
  if( product_type == SUBLINGUAL ) return {carrier:req_body.carrier, flavoring:req_body.flavoring};
  else if( product_type == SALVE ) return {essential_oils:req_body.essential_oils};
}

//this method doesn't handle errors pulling inventory which is going to be a problem eventually
function pullInventory( ingredients ){
  for( let i in ingredients ){
    if( i == WPE ) wpe_batches.pullBatch( ingredients[i].key, ingredients[i].total_amount );
    else inventory.pullInventory( ingredients[i].key, ingredients[i].lot_number, ingredients[i].total_amount );
  }
  return true;
}

//switch to next batch on anything that can make less than "unit_count" units
function advanceLimitingIngredients( ingredients, unit_count ){
  if(!unit_count) unit_count = 0;
  for( let i in ingredients ){
    if( ingredients[i].max_units <= unit_count ){
      if( i == WPE ) wpe_batches.retireBatch( ingredients[i].id );
      else inventory.retireInventory( ingredients[i].key, ingredients[i].lot_number );
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
*/

const WPE = "wpe";
const WPE_TYPE = "whole plant extract";
const SUBLINGUAL = "sublingual";
const SALVE = "salve";

const fs = require('fs');
const bro = require('../server/bro');
const sessions = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const {renderError, renderTemplate} = require('../tools/rendering/render_util');
//const wpe_batches = require('../services/batches/batches');
const inventory = require('../services/inventory_manager');
const lots = require('../services/lots/lots');
const {precisify, MILS_PER_OZ} = require( '../tools/unit_converter');

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
