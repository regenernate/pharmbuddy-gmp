
module.exports.base_route_path = "runs";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  try{
    //this if/then situation may not last if this router requires more routes
    if( !path || !path.length || path[0] == "" || path[0] == "list" ){
      let runs = await getAllRuns();
      let rtn = {};
      for( let l=0; l<runs.length; l++){
        if( !rtn.hasOwnProperty( runs[l].product_type ) ) rtn[ runs[l].product_type ] = [];
        rtn[ runs[l].product_type ].push( runs[l] );
      }
      return bro.get( true, renderTemplate( req, pages.run_list, {run_count:runs.length, runs:rtn} ) );
    }else if( path == "pull_dates" ){
      if(!req.body ) throw new Error('There was no date sent for this pull date record.');
      let pds = await savePullDate( req.body.run_id, req.body.pull_prop, req.body[req.body.pull_prop] );
      if(!pds) throw new Error('Could not save pull date.');
      return bro.redirect("/runs/" + req.body.run_id );
    }else{
      let run_id = path[0];
      if(!run_id || run_id.length <= 0) return bro.get( true, renderError( req, "You didn't include a run id in this request...try finding one <a href='/runs/list'>in this list</a>."));
      let run = await getRun( run_id );
      if( !run ) throw new Error("There was no run matching the run_id sent ( it was " + run_id + ")" );
      return bro.get( true, renderTemplate( req, pages.view_run, run ) );
    }
  }catch(error){
    console.log(error.stack);
    return bro.get( true, renderError( req, error.message ) );
  }
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun, getAllRuns, savePullDate } = require('../services/production_runs/runs');
const { getFSELabel, getIngredientLabel, getProductBatchId } = require("../services/inventory_manager");

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { run_list:1, view_run:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
