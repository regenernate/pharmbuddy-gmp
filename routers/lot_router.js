
module.exports.base_route_path = "lots";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( !auth_check ) return auth_check;
  try{
    //this if/then situation may not last if this router requires more routes
    if( !path || !path.length || path[0] == "" || path[0] == "list" ){
      let lots = getLotsAndRuns();
      console.log(lots.sublingual[0].runs);
      return bro.get( true, renderTemplate( req, pages.lot_list, {lots:lots} ) );
    }else if( path[0] == "run"){
      let run_id = path[1];
      if(!run_id || run_id.length <= 0) return bro.get( true, renderError( req, "You didn't include a run id in this request...what are you looking for?"));
      let run = getRun( run_id );
      //add the batch id and lot id

      //catch case of invalid run requested
      if( !run ) throw new Error("There was no run matching the run_id sent ( it was " + run_id + ")" );

      run.wpe.label = getWPELabel( run.wpe.key );
      for( let i in run.ingredients ){
        run.ingredients[i].label = getIngredientLabel( run.ingredients[i].key );
      }
      console.log(run);
      //need to change how we store the wpe lot number so easier to look up the product batch id
      //run.ingredients.wpe.lot_number
      run.batch_id = getProductBatchId( run.product_type, run.wpe.lot_number, run.strength );

      return bro.get( true, renderTemplate( req, pages.view_run, run ) );
    }else return bro.get( true, renderError( req, "Unrecognized route."));
  }catch(error){
    console.log(error.stack);
    return bro.get( true, renderError( req, error.message ) );
  }
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun, getLotsAndRuns } = require('../services/lots/lots');
const { getWPELabel, getIngredientLabel, getProductBatchId } = require("../services/inventory_manager");

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { lot_list:1, view_run:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
