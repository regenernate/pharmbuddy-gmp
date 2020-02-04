/*********

PURPOSE: To manage request flow for creating product runs

**********/


module.exports.base_route_path = "production";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first

  let rd = getRegisteredDevice( req );
  if( !rd ){ //must be registered
    return bro.redirect('/register/');
  }
  let rp = getResponsibleParty( req );
  if( !rp ){ //must have a responsible party logged in
    return bro.redirect('/login/');
  }
  if( !path || !path.length || path[0] == "" || path[0] == "production_run" ){
    return bro.get( true, renderTemplate( req, pages.production_run ) );
  }else if( path[0] == "calculate_ingredients" || path[0] == "confirm_run" ){
    let r;
    try{
      if( !req.body ) throw new Error("You must send appropriate data to the formulator! Post body was undefined.");
      ///get fshe batch public object from inventory to send to calculator
      let fshe = getBatchForProduct( SUBLINGUAL );
      //add ability to send fshe batch object to calculate method

      r = await calculateIngredients( req.body.quantity, req.body.carrier, req.body.strength, req.body.flavoring, fshe );

      //maybe think of it as asking inventory how many units we can make for given formulation
      
      //then compare against requested amount and display max possible from current inventory or quantity requested, whichever is less

      //now that we know how much of everything we need, confirm we have it
      let inv = await checkInventory( req.body.quantity, r.formula, r.units );
      //if anything is out ... decide what to do



      //return everything
      r.inventory = inv;

      //need to calculate total amounts based on quantity requested, since that is not done in the formulator any longer


      if( path[0] == "confirm_run" ){
        //create the run id, store it in the db along with run details, and return the confirmation page
        console.log("production_router :: confirm run");
      }
    }catch(err){
      console.log("production_router error :: ", err.message);
      return bro.get( true, renderError( req, "production router :: " + err.message, 'logged_out' ) );
    }
    return bro.get( true, renderTemplate( req, pages[ path[0] ], r ) );
  }else{
    return bro.get( true, renderError( req, "This route doesn't exist.", 'logged_out' ) );
  }
}

const FSHE = "fshe";
const SUBLINGUAL = "sublingual";
const SALVE = "salve";

const fs = require('fs');
const bro = require('../server/bro');
const { getRegisteredDevice, getResponsibleParty } = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const {renderError, renderTemplate} = require('../tools/rendering/render_util');
const { calculateIngredients } = require('../services/formulations/formulator');
const { checkInventory } = require('../services/inventory/inventory');
const { getBatchForProduct } = require('../services/batches/batches');

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { production_run:1, calculate_ingredients:1, confirm_run:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
