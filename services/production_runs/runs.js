
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


module.exports.getAllRuns = async function(){
//  return lots_by_product_type;
  let f = await runs.find().sort({product_type:1, run_date:1});
  return await f.toArray();
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
