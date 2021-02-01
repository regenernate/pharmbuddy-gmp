/*****

PURPOSE: The purpose of this service is to keep track of product batches

*****/

module.exports.getProductBatchId = function( product_type, batch_id, strength ){
//  console.log("product_batches.getProductBatchId", product_type, batch_id, strength );
  for( let i in product_batches ){
    let tpb = product_batches[i];
    if( tpb.batch_id == batch_id && tpb.product_type == product_type && tpb.strength == strength ) return tpb.id;
  }
  let tpbid = next_pbid++;
  product_batches.push( { id:tpbid, batch_id:batch_id, product_type:product_type, strength:strength } );
  return tpbid;
}

module.exports.initialize = initialize;

function initDb(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { product_batches } = loadData("./services/batches/data/product_batches.json") );

  loadData = null;
  {
    id: 100,
    strength: 300,
    product_type: 'sublingual',
    product_name: '300mg Sublingual',
    batch_id: '3',
    current_count: 40
  },

  console.log("pd2...", product_batches);
/*  for( let i in product_batches ){
    let r = pbatches.upsert( {key:product_batches[i].id}, product_batches[i] );
  }
  */
}

async function initialize(){
  if( pbatches ) return;
  pbatches = await ds.collection('product_batches');
  initDb();
}


module.exports.saveProductBatch = function( batch ){

}

var pbatches;
var next_pbid = 106;
const ds = require("../../tools/data_persistence/mongostore");
