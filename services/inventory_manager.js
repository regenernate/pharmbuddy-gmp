
module.exports.getIngredientsFor = function( product_type ){
  let pt = product_type.toLowerCase();
  for( let i in product_key ){
    if( product_key[i].product_type.key == pt ){
      return product_key[i];
    }
  }
}

module.exports.getIngredientLot = function( item_key ){
  return inventory.getIngredientLot( item_key );
}

module.exports.getWPELot = function( batch_key ){
  return wpe_batches.getBatchLot( batch_key );
}

module.exports.calculateMaxUnitsByMass = function( item_key, lot_number, mass_per_unit ){
  let ingredient = inventory.getAvailableMass( item_key, lot_number );
  ingredient.max_units = Math.floor( ingredient.mass / mass_per_unit );
  return ingredient;
}

module.exports.calculateMaxUnitsByVolume = function( item_key, lot_number, volume_per_unit ){
  let ingredient = inventory.getAvailableVolume( item_key, lot_number );
  ingredient.max_units = Math.floor( ingredient.volume / volume_per_unit );
  return ingredient;
}

module.exports.calculateWPEMaxUnits = function( batch_key, mass_per_unit ){
  let batch = wpe_batches.getAvailableMass( batch_key );
  batch.max_units = Math.floor( batch.mass / mass_per_unit );
  return batch;
}

module.exports.getIngredientLabel = function( item_key ){
  return inventory.getIngredientName( item_key );
}

module.exports.getWPELabel = function( batch_key ){
  return wpe_batches.getBatchName( batch_key );
}

module.exports.getProductTypes = function(){
  let ptypes = [];
  for( let i in product_key ){
    ptypes.push( product_key[i].product_type );
  }
  return ptypes;
}

module.exports.getProduct = function( product_type ){
  for( let i in product_key ){
    if( product_key[i].product_type.key == product_type ) return { key:product_key[i].product_type.key, label:product_key[i].product_type.label };
  }
  return false;
}

module.exports.getBatchForProduct = function( product_type ){
  return wpe_batches.getBatchForProduct( product_type );
}

module.exports.getProductBatchId = function( product_type, wpe_lot, strength ){
  return products.getProductBatchId( product_type, wpe_lot, strength );
}

module.exports.advanceWPELot = function( wpe, product_type ){
  if( wpe_batches.retireBatch( wpe.key ) ){
    let l = wpe_batches.getBatchForProduct( product_type );
    console.log( "inventory_manager.advanceWPELot :: need to dispatch event here" );
    if( l ) return l;
    else return {lot_number:false, label:"Whole Plant Extract"};
  }else{
    return false;
  }
}

module.exports.advanceIngredientLot = function( ingredient ){
  if( !ingredient.hasOwnProperty( 'key' ) ) throw new Error('illegal advanceIngredientLot call!');
  if( !ingredient.hasOwnProperty( 'lot_number' ) || !ingredient.lot_number ) ingredient.lot_number = inventory.getIngredientLot( ingredient.key ).lot_number;
//  if( !sessions.isValidResponsibleParty( ingredient.responsible_party ) ) throw new Error( 'illegal attempt to advanceIngredientLot without proper authorization' );
  if( !ingredient.hasOwnProperty( 'responsible_party' ) || !ingredient.responsible_party ) throw new Error( 'advanceIngredientLot call ... no responsible party, no access!');
  if( !ingredient.hasOwnProperty( 'registered_device' ) || !ingredient.registered_device ) throw new Error( 'advanceIngredientLot call ... no registered device, no access!');
  if( inventory.retireIngredient( ingredient.key, ingredient.lot_number ) ){
    //log if the new lot is the last lot in inventory!
    let l = inventory.getIngredientLot( ingredient.key )
    //dispatch event with change
    console.log( "inventory_manager.advanceIngredientLot :: need to dispatch an event here for logging to catch and record advancement of inventory ");
    return l;
  }else{
    return false;
  }
}

module.exports.getIngredientList = function(){
  return inventory.getIngredientList();
}

module.exports.getBatchList = function(){
  return wpe_batches.getBatchList();
}

module.exports.pullIngredientsForRun = function( ingredients, wpe ){
  //ultimately need to implement rollback here if any pull fails
  console.log("inventory_manager.pullIngredientsForRun - need to implement rollback if pull fails from any ingredient or the wpe");
  wpe_batches.pullFromBatch( wpe.key, wpe.total_amount );
  for( let i in ingredients ){
    if( ingredients[i].units == GRAMS ){
      inventory.pullMassFromLot( ingredients[i].key, ingredients[i].lot_number, ingredients[i].total_amount );
    }else{
      let ta = ingredients[i].total_amount;
      if( ingredients[i].units == OUNCES ){
        ta = ozToMils( ta );
      }
      inventory.pullVolumeFromLot( ingredients[i].key, ingredients[i].lot_number, ta );
    }
  }
  return true;
}

function initialize(){
  ( { product_key } = loadData("./services/product_key.json") );
  loadData = null;
  //create index by id for quick reference
  for( let i in product_key ){ //for each product definition
    for( let j in product_key[i] ){ //for each part of a product definition
      if( j == "product_type" || j == "strength" ) continue;
      if(  Array.isArray(product_key[i][j]) ){
        for( let k in product_key[i][j] ){ //for each ingredient
          if( product_key[i][j][k].hasOwnProperty( 'key' )){
            product_key[i][j][k].label = inventory.getIngredientName( product_key[i][j][k].key );
          }
        }
      }
    }
  }
}

let {loadData} = require( "../tools/filesys/filesys_util");
const inventory = require('./ingredients/ingredients');
const wpe_batches = require('./batches/wpe_batches');
const products = require('./batches/product_batches');
const {GRAMS, OUNCES, MILS, ozToMils} = require('../tools/unit_converter');
var product_key;
initialize();
