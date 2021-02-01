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
        if( req.body.limiting_type == FSE ){
          advanced_lot = await inventory.advanceFSELot( {batch_id:req.body.limiting_batch_id, responsible_party:sessions.getResponsibleParty(req), registered_device:sessions.getRegisteredDevice(req) }, req.body.product_type );
        }else{
          advanced_lot = await inventory.advanceIngredientLot( {key:req.body.limiting_key, lot_number:req.body.limiting_lot, responsible_party:sessions.getResponsibleParty(req), registered_device:sessions.getRegisteredDevice(req) }, req.body.product_type );
        }
//        if( !advanced_lot ) throw new Error("Inventory could not be advanced, probably because I ain't got no " + req.body.limiting_key + ".");
//        if( !advanced_lot.lot_number ) throw new Error("Unfortunately there are no more lots of " + advanced_lot.label + "." );
      }

      //get which full spectrum extract batch to use
      let fse_batch;
      if( req.body.fse_batch_id ) fse_batch = await inventory.getFSELot( req.body.fse_batch_id );
      else fse_batch = await inventory.getBatchForProduct( req.body.product_type ); //get correct fse batch object { key: , label: , percent_cbd: }
      //get formulator to use based on product type being made
      let formulator = formulators[ req.body.product_type ];
      if(!formulator) throw new Error( "No formulator exists for " + req.body.product_type );
      formula = await formulator.createFormula( req.body, fse_batch );

      let ingredient_lot, max_units, amount_needed;
      max_units = await inventory.calculateFSEMaxUnits( formula.fse.batch_id, formula.fse.amount );
      formula.fse.lot_number = fse_batch.lot_number;
      formula.fse.max_units = max_units.max_units;
      formula.fse.warning_level = max_units.warning_level;
      formula.fse.label = fse_batch.label;
      let limiting_ingredient = formula.fse;
      let limiting_type = "fse";
      let warning_level = formula.fse.warning_level;
      for( let i in formula.ingredients ){
        let iln = await inventory.getIngredientLot( formula.ingredients[i].key, req.body.product_type );
        if(!iln){
          formula.ingredients[i].label = await inventory.getIngredientLabel( formula.ingredients[i].key );
          limiting_ingredient = formula.ingredients[i];
          limiting_type = "ingredient";
          continue;
        }
        formula.ingredients[i].lot_number = iln.lot_number;
        if( formula.ingredients[i].units == 'g' ) max_units = await inventory.calculateMaxUnitsByMass( formula.ingredients[i].key, formula.ingredients[i].lot_number, formula.ingredients[i].amount );
        else{
          amount_needed = formula.ingredients[i].amount;
          if( formula.ingredients[i].units == 'oz' ) amount_needed *= MILS_PER_OZ;
          max_units = await inventory.calculateMaxUnitsByVolume( formula.ingredients[i].key, formula.ingredients[i].lot_number, amount_needed );
        }
        console.log( "production_router :: ", max_units );
        formula.ingredients[i].max_units = max_units.max_units;
        formula.ingredients[i].warning_level = max_units.warning_level;
        formula.ingredients[i].label = iln.label;
        if( max_units.max_units < limiting_ingredient.max_units ){
          limiting_ingredient = formula.ingredients[i];
          limiting_type = "ingredient";
        }
        if( formula.ingredients[i].warning_level ) warning_level = true;
      }
      formula.limit = { warning_level:warning_level, type:limiting_type, item:limiting_ingredient };
      if( advanced_lot ){
        formula.message = "Success. This formulation is using the next lot of " + advanced_lot.label + ".";
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
//    console.log("******* FORMULA REQUESTED ********")
//    console.log(formula);
//    console.log("******* END FORMULA REQUESTED ********")
    return bro.get( true, renderTemplate( req, pages.calculate_ingredients, formula ) );
  }else if( path[0] == "create_run" ){
    let fse_batch;
    try{
      if( req.body.fse_key ) fse_batch = await inventory.getFSELot( req.body.fse_batch_id );
      else fse_batch = await inventory.getBatchForProduct( req.body.product_type ); //get correct fse batch object { key: , label: , percent_cbd: }
      //get formulator to use based on product type being made
      let formulator = formulators[ req.body.product_type ];
      if(!formulator) throw new Error( "No formulator exists for " + req.body.product_type );
      formula = await formulator.createFormula( req.body, fse_batch );
      let units_to_make = req.body.units_requested;
      formula.fse.total_amount = precisify(units_to_make * formula.fse.amount);
      formula.fse.lot_number = fse_batch.lot_number;
      formula.fse.label = fse_batch.label;
      let limiting_ingredient = false;
      for( let i in formula.ingredients ){
        let iln = await inventory.getIngredientLot( formula.ingredients[i].key );
        if(!iln){
          limiting_ingredient = formula.ingredients[i];
          formula.ingredients[i].label = await inventory.getIngredientLabel( formula.ingredients[i].key );
          break;
        }
        formula.ingredients[i].lot_number = iln.lot_number;
        formula.ingredients[i].total_amount = precisify( units_to_make * formula.ingredients[i].amount );
        formula.ingredients[i].label = iln.label;
      }
      if( limiting_ingredient ) return bro.get( true, renderError( req, "<p>It turns out the " + limiting_ingredient.label + " used in this formulation is no longer available. You'll have to <a href='/production'>create a new run</a>.</p><p>Or you can <a href='/inventory/" + ((limiting_type == 'fse') ? "fse/" + limiting_ingredient.batch_id : limiting_ingredient.key ) + "'>update inventory here</a>.</p><p>And maybe don't use the browser back button so much :).</p>"));
      formula.units_made = units_to_make;
      formula.strength = req.body.strength;
      formula.product_type = req.body.product_type;
      //get product batch id here ...
      formula.batch_id = inventory.getProductBatchId( req.body.product_type, formula[ FSE ].lot_number, req.body.strength );

      let run_id = await runs.createRun( formula );
      if( !run_id ) return bro.get( true, renderError( req, "The run you requested could not be created." ) );

      //formula.run_id = run_id; - because we send the formula object, createRun has already added the run_id
      //pullInventory for this run
      if( !await inventory.pullIngredientsForRun( formula.ingredients, formula.fse ) ){
        //maybe delete run??
        return bro.get( true, renderError( req, "The inventory could not be pulled based on the formulation requested.") );
      }

      console.log(formula);

      return bro.get( true, renderTemplate( req, pages.confirm_run, formula ) );
    }catch(e){
      return bro.get( true, renderError( req, e.message ) );
    }
  }else{
    return bro.get( true, renderError( req, "This route doesn't exist.", 'logged_out' ) );
  }
}

const FSE = "fse";
const FSE_TYPE = "full spectrum extract";
const SUBLINGUAL = "sublingual";
const SALVE = "salve";

const fs = require('fs');
const bro = require('../server/bro');
const sessions = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const {renderError, renderTemplate} = require('../tools/rendering/render_util');
//const fse_batches = require('../services/batches/batches');
const inventory = require('../services/inventory_manager');
const runs = require('../services/production_runs/runs');
runs.initialize();

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
