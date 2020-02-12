
module.exports.getIngredientsFor = function( product_type ){
  let pt = product_type.toLowerCase();
  for( let i in product_key ){
    if( product_key[i].product_type.key == pt ){
      return product_key[i];
    }
  }
}

module.exports.getIngredientLot = function( item_key ){
  return ingredients.getIngredientLot( item_key );
}

module.exports.getWPELot = function( batch_key ){
  return wpe_batches.getBatchLot( batch_key );
}

module.exports.calculateMaxUnitsByMass = function( item_key, lot_number, mass_per_unit ){
  let ingredient = ingredients.getAvailableMass( item_key, lot_number );
  ingredient.max_units = Math.floor( ingredient.mass / mass_per_unit );
  return ingredient;
}

module.exports.calculateMaxUnitsByVolume = function( item_key, lot_number, volume_per_unit ){
  let ingredient = ingredients.getAvailableVolume( item_key, lot_number );
  ingredient.max_units = Math.floor( ingredient.volume / volume_per_unit );
  return ingredient;
}

module.exports.calculateWPEMaxUnits = function( batch_key, mass_per_unit ){
  let batch = wpe_batches.getAvailableMass( batch_key );
  batch.max_units = Math.floor( batch.mass / mass_per_unit );
  return batch;
}

module.exports.getIngredientLabel = function( item_key ){
  return ingredients.getIngredientName( item_key );
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
            product_key[i][j][k].label = ingredients.getIngredientName( product_key[i][j][k].key );
          }
        }
      }
    }
  }
}

let {loadData} = require( "../tools/filesys/filesys_util");
const ingredients = require('./ingredients/ingredients');
const wpe_batches = require('./batches/wpe_batches');
const products = require('./batches/product_batches');
var product_key;
initialize();
