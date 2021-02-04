/*****

PURPOSE: The purpose of this service is to keep track of product batches

Sample Product Lot follows
{
  "id":100,
  "strength":300,
  "product_type":"sublingual",
  "product_name":"300mg Sublingual",
  "batch_id":"3", //this is the id of the FSE Batch
  "current_count":40
},

*****/

module.exports.getProductLotNumber = function( product_type, batch_id, strength ){
//  console.log("product_lots.getProductBatchId", product_type, batch_id, strength );
  for( let i in product_lots ){
    let tpb = product_lots[i];
    if( tpb.batch_id == batch_id && tpb.product_type == product_type && tpb.strength == strength ) return tpb.id;
  }
  let tpbid = next_pbid++;
  product_lots.push( { id:tpbid, batch_id:batch_id, product_type:product_type, strength:strength } );
  return tpbid;
}

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { product_lots } = loadData("./services/lots/data/product_lots.json") );
  loadData = null;
}

var product_lots;
var next_pbid = 106;
initialize();
