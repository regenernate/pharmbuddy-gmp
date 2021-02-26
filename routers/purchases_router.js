/* Example order object stored internally
{
  run_id: '3',
  product_sku: '40005',
  position: '0',
  name: 'Robert Augspurger',
  email: 'robbie@wolfchoir.com',
  order_id: '98'
}
*/

module.exports.base_route_path = "purchases";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  try{
    //this if/then situation may not last if this router requires more routes
    if( !path || !path.length || path[0] == "" || path[0] == "list" ){
      let uncorrelated_orders = await correlations.getUncorrelatedOrders();
      return bro.get( true, renderTemplate( req, pages.order_list, { orders:uncorrelated_orders } ) );
    }else if( path[0] == "customer" ){
      return bro.get( true, renderError(req, 'Viewing all orders by customer has not been implement yet.'));
    }else if( path[0] == "update" ){
        let lod = await correlations.getLastOrderDate("shopify");
        let s = await shopify.getOrders(lod);
        return bro.redirect("/" + module.exports.base_route_path + "/");
    }else if( path[0] == "correlate" ){
      let order_id = path[1];
      if( isNaN(order_id) ) return bro.get( true, renderData( {success:false,message:"You didn't include an order id in this request...try finding one <a href='/purchases/list'>in this list</a>."}));
      else{
        req.body.order_id = order_id;
        //save this sucker to the db, upserting if it already exists
        try{
          if( !await correlations.saveCorrelation( req.body ) ) throw new Error("Correlation couldn't be saved.");
        }catch(e){
          console.log("purchases_router correlate path :: ", e.message);
          return bro.get(true, renderData({success:false, message:e.message}));
        }
        return bro.get( true, renderData({success:true }) );
      }
    }else{
      let order_id = path[0];
      if( isNaN(order_id) ) return bro.get( true, renderError( req, "You didn't include an order id in this request...try finding one <a href='/purchases/list'>in this list</a>."));
      else{
        let line_items = await correlations.getOrder( order_id );
        let runs = await getAllRuns();
        for( let i in line_items ){

          line_items[i].runs = await getRunsOfProduct( line_items[i], runs );

        }
        return bro.get( true, renderTemplate( req, pages.order_view, {line_items:line_items, runs:runs} ) );
      }
    }
  }catch(error){
    console.log(error.stack);
    return bro.get( true, renderError( req, error.message ) );
  }
}

async function getRunsOfProduct( item, all_runs ){
  let p_info = await shopify.getProduct(item);
  let rtn = [];
  for( let i in all_runs ){
    if( all_runs[i].product_type == p_info.type && all_runs[i].strength == p_info.strength ){
      rtn.push( all_runs[i] );
    }
  }
  return rtn;
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderData, renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun, getAllRuns } = require('../services/production_runs/runs');
const correlations = require('../services/purchases/correlations');
const { getFSELabel, getIngredientLabel, getProductBatchId } = require("../services/inventory_manager");
const counties = require("../tools/county_lookup/county_lookup.js");

var pages;
var ecwid = require('../tools/ecwid-cgmp.js');
const shopify = require('../tools/shopify-cgmp.js');

async function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { order_list:1, order_view:1, tax_by_state:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
  //await runs.initialize();
  await correlations.initialize();
  shopify.setSaveMethod( correlations.saveLineItem );
}

initialize();
