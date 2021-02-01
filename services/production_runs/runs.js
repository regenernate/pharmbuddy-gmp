
module.exports.createRun = async function( formula ){
  formula.run_id = getRunId();
  formula.run_date = moment().format('x');
  let r = await runs.insertOne(formula);
  return r.insertedCount == 1;
}

module.exports.getRun = async function( run_id ){
//  if( run_index.hasOwnProperty( run_id ) ) return getPublicObject( run_index[run_id] );
  let f = await runs.findOne({run_id:parseInt(run_id)});
  return f;
}

module.exports.getAllRuns = async function( run ){
//  return lots_by_product_type;
  if( run ) console.log("runs.getAllRuns matching run #" + run.run_id);
  let f = await runs.find().sort({product_type:1, run_date:1});
  return await f.toArray();
}

module.exports.savePullDate = async function( run_id, prop, date ){
  let f = await runs.findOne({run_id:parseInt(run_id)});
  if( prop != "first_pull_date" && prop != "last_pull_date" ){
    console.log("runs.js you can't save a pull date with property name :: ", prop);
    return false;
  }
  let rtn;
  if( f ){
    let set_prop = {};
    set_prop[prop] = date;
    rtn = await runs.updateOne({run_id:parseInt(run_id)}, {$set:set_prop});
    if( rtn.matchedCount == 1 ) return true;
  }
  return false;
}

module.exports.saveCorrelation = async function( purchased_item ){
  for( let i in purchased_item ){
    if( correlation_fields.indexOf( i ) < 0 ) throw new Error("runs.saveCorrelation found invalid field propery ( " + i + " ).");
  }
  for( let i=0; i<correlation_fields.length; i++ ){
    if( !purchased_item.hasOwnProperty( correlation_fields[i] ) ) throw new Error("runs.saveCorrelation parameter sent was missing required property ( " + correlation_fields[i] + " )");
  }
  let fnd = await purchased_items.findOne({order_id:purchased_item.order_id, product_sku:purchased_item.product_sku, position:purchased_item.position});
  let rtn;
  if( fnd && fnd.run_id != purchased_item.run_id ){ //update this entry
    rtn = await purchased_items.updateOne({_id:fnd._id}, {$set:{run_id:purchased_item.run_id}});
  }else if( !fnd ){
    rtn = await purchased_items.insertOne(purchased_item);
  }
  return rtn.modifiedCount > 0 || rtn.insertedCount > 0;
}

module.exports.getCorrelation = async function( order_id, product_sku, position ){
  let fnd = await purchased_items.findOne({order_id:String(order_id), product_sku:product_sku, position:String(position)});
  return fnd;
}

function getRunId(){
  let rtn = next_id;
  next_id++;
  return rtn;
}

const moment = require('moment');
const ds = require("../../tools/data_persistence/mongostore");
var runs, next_id, purchased_items;

//order_id=&run_id=&product_sku=&position=&name=&email=

const correlation_fields = ["order_id", "run_id", "product_sku", "position", "name", "email"];

module.exports.initialize = async function(){
  if( !runs ) runs = await ds.collection('production_runs');
  if( !purchased_items ) purchased_items = await ds.collection('purchased_items');
  let lrid = await runs.find({}).sort({run_id:-1}).limit(1).toArray();
  if( !lrid || !lrid.length ) next_id = 1;
  else next_id = lrid[0].run_id + 1;
//  let mct = await purchased_items.find().toArray();
//  console.log(mct);
}
