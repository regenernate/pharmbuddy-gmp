/*****

PURPOSE: The purpose of this service is to keep track of extraction batches and to provide batch identifiers upon request

*****/

/**** get current batch for product type sent  ********/
module.exports.getBatchForProduct = async function( use_type ){
  if( !use_type || typeof(use_type) !== "string" ) { console.log("batches.error in getBatchForUseType :: use_type was not a string"); return false; }
  let f = await batches.find({use_for:use_type, retired_date:null}).sort({production_date:1});
  if( await f.hasNext() ) return await f.next();
  else return false;
}

module.exports.pullFromBatch = async function( batch_id, total_amount ){
  let f = await batches.findOne({batch_id:batch_id});
  if(!f) return false;
  f.current_mass = f.current_mass - total_amount;
  if( f.current_mass < 0 ) f.current_mass = 0;
  let u = await batches.updateOne({batch_id:batch_id}, {$set:{current_mass:f.current_mass}});
  return u.modifiedCount == 1;
}

async function addBatch( batch ){
  let batch_id = await getNextBatchId();
  batch.batch_id = batch_id;
  if( !batch.lot_number ) batch.lot_number = batch.batch_id;
  if( !batch.label ) batch.label = generateBatchName( batch );
  //confirm this fse batch doesn't already exist
  let f = await batches.findOne({batch_id:batch.batch_id});
  if( f ) throw new Error('fse_batches.addBatch :: This batch already exists.');
  //confirm correct fields and only correct fields being added
  let plist = ['batch_id', 'lot_number', 'label', 'production_date', 'mechanism', 'location', 'percent_cbd', 'initial_mass', 'current_mass', 'use_for']
  for( let i in batch ){
    if( plist.indexOf( i ) < 0 ) throw new Error("Invalid property sent to fse_batches.addBatch :: " + i);
  }
  for( let i in plist ){
    if( !batch.hasOwnProperty( plist[i] ) ){
      throw new Error("Missing property in fse_batches.addBatch :: " + plist[i] );
    }
  }
  //insert the batch
  let iv = await batches.insertOne(batch);
  if( iv.insertedCount ) return true;
  return false;
}

module.exports.addBatch = addBatch;

module.exports.retireBatch = async function( batch_id ){
  let u = await batches.updateOne({batch_id:parseInt(batch_id)}, {$set:{retired_date:moment().format('x')}});
  return u.modifiedCount == 1;
}

module.exports.unretireBatch = async function( batch_id ){
  let u = await batches.updateOne({batch_id:parseInt(batch_id)}, {$unset:{retired_date:1}});
  return u.modifiedCount == 1;
}

module.exports.getBatchList = async function(){
  let f = await batches.find().sort({batch_id:1});
  return await f.toArray();
}

module.exports.getLotByBatchId = async function( batch_id ){
  return await getBatch(batch_id);
}

module.exports.getBatchName = async function( batch_id ){
  let item = await getBatch( batch_id );
  return item.label;
}

module.exports.updateAvailableMass = async function( batch_id, new_mass ){
  let f = await getBatch( batch_id );
  console.log(f);
  let u = await batches.updateOne({_id:f._id}, {$set:{current_mass:new_mass}});
  console.log("fse_batches.updateAvailableMass :: ", batch_id, u.modifiedCount );
  return u.modifiedCount == 1;
}

module.exports.getAvailableMass = async function( batch_id ){
  let b = await getBatch(batch_id);
  if( b ) return { mass:b.current_mass, batch_id:batch_id, warning_level:( b.current_mass / b.initial_mass <= WARNING_PERCENT ) };
  return false;
}

/***** base getters ********/
async function getBatch( batch_id ){
  let f = await batches.findOne({batch_id:parseInt(batch_id)});
  if( f ) return f;
  return false;
}

/******** initialization and data loading *********/

async function getNextBatchId(){
  let f = await batches.find().sort({ batch_id:-1 });
  while( await f.hasNext() ){
    let item = await f.next();
    if( item != null ) return parseInt(item.batch_id) + 1;
  }
  return 3;
}

function generateBatchName( batch ){
  //let d = moment(batch.production_date, 'x').format('MM-DD-YYYY');
  return "FSE batch# " + batch.batch_id;
}

async function initialize(){
  if( batches ) return true;
  batches = await ds.collection('fse');
  let f = await batches.find().toArray();
}

module.exports.initialize = initialize;

const WARNING_PERCENT = .1;
const moment = require('moment');
const { precisify } = require('../../tools/unit_converter');
var batches;
var ds = require("../../tools/data_persistence/mongostore");
