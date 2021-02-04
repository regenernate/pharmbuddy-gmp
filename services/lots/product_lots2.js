/*****

PURPOSE: The purpose of this service is to keep track of product batches

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

module.exports.initialize = initialize;

function initDb(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { product_lots } = loadData("./services/lots/data/product_lots.json") );

  loadData = null;
  {
    id: 100,
    strength: 300,
    product_type: 'sublingual',
    product_name: '300mg Sublingual',
    batch_id: '3',
    current_count: 40
  },

  console.log("pd2...", product_lots);
/*  for( let i in product_lots ){
    let r = p_lots.upsert( {key:product_lots[i].id}, product_lots[i] );
  }
  */
}

async function initialize(){
  if( p_lots ) return;
  p_lots = await ds.collection('product_lots');
  initDb();
}


module.exports.saveProductBatch = function( batch ){

}

var p_lots;
var next_pbid = 106;
const ds = require("../../tools/data_persistence/mongostore");
