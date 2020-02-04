/*****

PURPOSE: The purpose of this service is to keep track of extraction batches and to provide batch identifiers upon request

*****/

module.exports.getBatchForProduct = function( use_type ){
  if( !use_type || typeof(use_type) !== "string" ) { console.log("batches.error in getBatchForUseType :: use_type was not a string"); return false; }
  for( let i=0; i<batch_list.length; i++ ){
    if( batch_list[i].use_for.indexOf( use_type ) >= 0 ){
      return getPublicObject(batch_list[i].id);
    }
  }
  return false;
}

function initialize(){
  //use filesys_util to load the data
  let {loadData} = require( "../../tools/filesys/filesys_util");

  batch_list = loadData("./services/batches/data/batches.json").batch_list;
  loadData = null;
  //create index by id for quick reference

  for( let i in batch_list ){
    batch_index[ batch_list[i].id ] = batch_list[i];
  }
}

var batch_list;
var batch_index = {};
initialize();

function getPublicObject( id ){
  if( batch_index.hasOwnProperty( id ) ){
    return { id:id, percent_cbd:batch_index[id].percent_cbd };
  }
  else return false;
}
