/*****

PURPOSE: The purpose of this service is to keep track of product batches

Currently these are not persisted to database because they only change rarely when we add new products OR new strengths OR new extract

Sample Product Lot follows
{
  "id":100,
  "strength":300,
  "product_type":"sublingual",
  "product_name":"Extract 3 - 300mg sublingual", //generated internally from strength, product_type and extract_id properties
  "extract_id":"3" //this is the id of the FSE Batch
}

*****/

module.exports.getProductLotNumber = function( product_type, extract_id, strength ){
  for( let i in product_lots ){
    let tpb = product_lots[i];
    if( tpb.extract_id == extract_id && tpb.product_type == product_type && tpb.strength == strength ) return tpb.id;
  }
  let tpbid = next_pbid++;
  product_lots.push( { id:tpbid, extract_id:extract_id, product_type:product_type, strength:strength } );
  console.log("Uh-oh! We have created a new product lot which will not be persisted. Nathan screwed up.");
  throw new Error( "product_lots.js - product lot not found for " + product_type + " with extract id " + extract_id + " and strength " + strength );
  return tpbid;
}

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  ( { product_lots } = loadData("./services/lots/data/product_lots.json") );
  for( let i in product_lots ){
    //generate product names
    product_lots[i].product_name = "Extract " + product_lots[i].extract_id + " - " + product_lots[i].strength + "mg " + product_lots[i].product_type;
  }
  loadData = null;
}

var product_lots;
var next_pbid = 106;
initialize();
