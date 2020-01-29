/*********

PURPOSE: To route formulation requests to the correct service method(s) and return the appropriate template view

**********/


module.exports.base_route_path = "production";

const { getRegisteredDevice } = require('./registration_router');
const { getResponsibleParty } = require('./statics_router');
const fs = require('fs');
const bro = require('../server/bro');
const template_manager = require('../views/template_manager');
const { calculateIngredients } = require('../services/formulations/formulator');
const { checkInventory } = require('../services/inventory/inventory');

/***********  load templates for this router ************/
const dir = "./views/mains/";
var pages = template_manager.compileTemplates( { production_run:(dir + "production_run.handlebars"),
                                                calculate_ingredients:(dir + "confirm_ingredients.handlebars"),
                                                confirm_run:(dir + "confirm_run.handlebars") }, true );

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let rd = getRegisteredDevice( req );
  if( !rd ){ //must be registered
    return bro.get( true, null, null, '/register/');
  }
  let rp = getResponsibleParty( req );
  if( !rp ){ //must have a responsible party logged in
    return bro.get( true, null, null, '/login/');
  }
  if( !path || !path.length || path[0] == "" || path[0] == "production_run" ){
    return bro.get( true, template_manager.executeTemplate( pages.production_run, { responsible_party:rp, registered_device:rd }, 'logged_out') );
  }else if( path[0] == "calculate_ingredients" || path[0] == "confirm_run" ){
    let r;
    try{
      if( !req.body ) throw new Error("You must send appropriate data to the formulator! Post body was undefined.");
      r = await calculateIngredients( req.body.quantity, req.body.carrier, req.body.strength, req.body.flavoring );
      let inv = await checkInventory( r.request, r.formulation );
      r.inventory = inv;
      r.registered_device = rd;
      r.responsible_party = rp;
      if( path[0] == "confirm_run" ){
        //create the run id, store it in the db along with run details, and return the confirmation page
        console.log("formulating_router :: confirm run");
      }
    }catch(err){
      console.log("formulating_router error :: ", err.message);
      return bro.get( true, template_manager.executeTemplate( null, "Formulating router :: " + err.message, 'logged_out' ));
    }
    return bro.get( true, template_manager.executeTemplate( pages[ path[0] ], r, 'logged_out' ) );
  }else{
    return bro.get( true, template_manager.executeTemplate( null, "This route doesn't exist.", 'logged_out' ) );
  }
}
