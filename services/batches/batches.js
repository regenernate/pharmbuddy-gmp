/*****

PURPOSE: The purpose of this service is to keep track of extraction batches and to provide batch identifiers upon request

*****/

module.exports.getBatchForProduct = function( use_type ){
  if( !use_type || typeof(use_type) !== "string" ) { console.log("batches.error in getBatchForUseType :: use_type was not a string"); return false; }
  for( let i=0; i<batch_list.length; i++ ){
    if( batch_list[i].use_for.indexOf( use_type ) >= 0 && batch_list[i].current_mass > 0 ){
      return getPublicObject(batch_list[i].id);
    }
  }
  return false;
}

module.exports.getUnitsAvailable = async function( id, amount_per_unit ){
  let b = getPrivateObject( id );
  if( !b ) throw new Error( 'batches.error in getUnitsAvailable :: object requested could not be found' );
  return { lot_number:b.id, max_units:Math.floor( b.current_mass / amount_per_unit ) };
}

module.exports.pullBatch = function( id, total_amount ){
    let b = getPrivateObject( id );
    b.current_mass -= total_amount;
    if( b.current_mass < 0 ) b.current_mass = 0;
    return true;
}

module.exports.retireBatch = function( id ){
  let b = getPrivateObject( id );
  if( b ){
    b.current_mass = 0;
    b.retired_date = moment().format('x');
    return true;
  }
  return false;
}

module.exports.getProductBatchId = function( product_type, batch_id, strength ){
  for( let i in product_batches ){
    let tpb = product_batches[i];
    if( tpb.batch_id == batch_id && tpb.product_type == product_type && tpb.strength == strength ) return tpb.id;
  }
  let tpbid = next_pbid++;
  product_batches.push( { id:tpbid, batch_id:batch_id, product_type:product_type, strength:strength } );
  return tpbid;
}

var next_pbid = 105;

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { batch_list, product_batches } = loadData("./services/batches/data/batches.json") );
  loadData = null;
  //create index by id for quick reference

  for( let i in batch_list ){
    batch_index[ batch_list[i].id ] = batch_list[i];
  }
}

const moment = require('moment');
var batch_list, product_batches;
var batch_index = {};
initialize();

function getPublicObject( id ){
  if( batch_index.hasOwnProperty( id ) ){
    return { id:id, percent_cbd:batch_index[id].percent_cbd };
  }
  return false;
}

function getPrivateObject( id ){
  if( batch_index.hasOwnProperty( id ) ){
    return batch_index[ id ];
  }
  return false;
}
