/*****

PURPOSE: The purpose of this service is to keep track of product batches

*****/

module.exports.getProductBatchId = function( product_type, batch_id, strength ){
  console.log("product_batches.getProductBatchId", product_type, batch_id, strength );
  for( let i in product_batches ){
    let tpb = product_batches[i];
    if( tpb.batch_id == batch_id && tpb.product_type == product_type && tpb.strength == strength ) return tpb.id;
  }
  let tpbid = next_pbid++;
  product_batches.push( { id:tpbid, batch_id:batch_id, product_type:product_type, strength:strength } );
  return tpbid;
}

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { product_batches } = loadData("./services/batches/data/product_batches.json") );
  loadData = null;
}

var product_batches;
var next_pbid = 106;
initialize();
