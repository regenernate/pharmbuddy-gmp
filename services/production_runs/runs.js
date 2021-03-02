
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

module.exports.deleteRun = async function( run_id ){
  let r = await runs.deleteOne({run_id:parseInt(run_id)});
  return r.deletedCount > 0;
}

function getRunId(){
  let rtn = next_id;
  next_id++;
  return rtn;
}

const moment = require('moment');
const ds = require("../../tools/data_persistence/mongostore");
var runs, next_id;


module.exports.initialize = async function(){
  if( !runs ) runs = await ds.collection('production_runs');
  let lrid = await runs.find({}).sort({run_id:-1}).limit(1).toArray();
  if( !lrid || !lrid.length ) next_id = 1;
  else next_id = lrid[0].run_id + 1;
}
