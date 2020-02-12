/*****

PURPOSE: The purpose of this service is to keep track of extraction batches and to provide batch identifiers upon request

*****/

/**** get current batch for product type sent  ********/
module.exports.getBatchForProduct = function( use_type ){
  if( !use_type || typeof(use_type) !== "string" ) { console.log("batches.error in getBatchForUseType :: use_type was not a string"); return false; }
  for( let i=0; i<batch_list.length; i++ ){
    if( batch_list[i].use_for.indexOf( use_type ) >= 0 && batch_list[i].current_mass > 0 ){
      return getBatch( batch_list[i].key );
    }
  }
  return false;
}

module.exports.pullBatch = function( batch_key, total_amount ){
    let b = getBatch( batch_key );
//    console.log( "batches.pullBatch :: " + batch_key + " : " + total_amount, b );
    b.current_mass = precisify( b.current_mass - total_amount );
    if( b.current_mass < 0 ) b.current_mass = 0;
    return true;
}

module.exports.retireBatch = function( batch_key ){
  let b = getBatch( batch_key );
  if( b ){
    b.current_mass = 0;
    b.retired_date = moment().format('x');
    return true;
  }
  return false;
}

module.exports.getBatchList = function(){
  return batch_list;
}

module.exports.getBatchLot = function( batch_key ){
  for( let i=0; i<batch_list.length; i++ ){
    if( batch_list[i].key == batch_key ){
      let b = batch_list[i];
      return { key:batch_key, lot_number:b.lot_number };
    }
  }
  return false;
}

module.exports.getBatchName = function( batch_key ){
  return getBatch( batch_key ).label;
}

module.exports.getAvailableMass = function( batch_key ){
  for( let i=0; i<batch_list.length; i++ ){
    if( batch_list[i].key == batch_key ){
      let b = batch_list[i];
      return { mass:b.current_mass, key:batch_key, warning_level:( b.current_mass / b.initial_mass <= WARNING_PERCENT ) };
    }
  }
  return false;
}

/***** base getters ********/
function getBatch( batch_key ){
  if( batches_key.hasOwnProperty( batch_key ) ){
    return { key:batch_key, label:batches_key[ batch_key ].label, percent_cbd:batches_key[ batch_key ].percent_cbd };
  }
  return false;
}

/******** initialization and data loading *********/

function generateBatchKey( batch ){
  return moment(batch.production_date, 'x').format('MMDDYYYY') + "_" + batch.mechanism.split(" ").join("_");
}

function generateBatchName( batch ){
  //let d = moment(batch.production_date, 'x').format('MM-DD-YYYY');
  return "WPE batch# " + batch.batch_id;
}

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { batch_list } = loadData("./services/batches/data/wpe_batches.json") );
  loadData = null;
  //create index by id for quick reference

  for( let i in batch_list ){
    batch_list[i].key = generateBatchKey( batch_list[i] );
    batch_list[i].label = generateBatchName( batch_list[i] );
    batches_key[ batch_list[i].key ] = batch_list[i];
  }
}

const WARNING_PERCENT = .1;
const moment = require('moment');
const { precisify } = require('../../tools/unit_converter');
var batch_list;
var batches_key = {};
initialize();
