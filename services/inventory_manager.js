
module.exports.getIngredientsFor = function( product_type ){
  let pt = product_type.toLowerCase();
  for( let i in product_key ){
    if( product_key[i].product_type.key == pt ){
      return product_key[i];
    }
  }
}

module.exports.getIngredientLot = async function( item_key, product_type ){
  let il = await ingredients.getCurrentLot( item_key, product_type );
  if(!il) return false;
  return il;
}

module.exports.addIngredientLot = async function( item_key, lot_details ){
  return await ingredients.addLot(item_key, lot_details);
}

module.exports.getAllInventoryFor = async function( item_key ){
  return await ingredients.getAllInventoryFor( item_key );
}

module.exports.getFSELot = async function( batch_id ){
  if( batch_id ) return await fse_batches.getLotByBatchId( batch_id );
  else return false;
}

module.exports.calculateMaxUnitsByMass = async function( item_key, lot_number, mass_per_unit ){
  let r = { key:item_key, lot_number:lot_number }
  let i = await ingredients.getItem( item_key, lot_number );
  if(i){
    let m = milsToGrams(i.current_volume, i.key);
    r.max_units = Math.floor( m / mass_per_unit );
    r.warning_level = ( i.current_volume / i.initial_volume ) < .1;
  }else{
    r.max_units = 0;
    console.log("inventory_manager.calculateMaxUnitsByMass :: could not find item " + item_key + " : " + lot_number);
  }
  return r;
}

module.exports.calculateMaxUnitsByVolume = async function( item_key, lot_number, volume_per_unit ){
  let r = {key:item_key, lot_number:lot_number};
  let i = await ingredients.getItem( item_key, lot_number );
  if(i){
    let m = i.current_volume;
    r.max_units = Math.floor( m / volume_per_unit );
    r.warning_level = ( i.current_volume / i.initial_volume ) < .1;
  }else{
    r.max_units = 0;
    console.log("inventory_manager.calculateMaxUnitsByVolume :: could not find item " + item_key + " : " + lot_number);
  }
  return r;
}

module.exports.calculateFSEMaxUnits = async function( batch_id, mass_per_unit ){
  let batch = await fse_batches.getAvailableMass( batch_id );
  batch.max_units = Math.floor( batch.mass / mass_per_unit );
  return batch;
}

module.exports.getIngredientLabel = async function( item_key ){
  return await ingredients.getIngredientLabel( item_key );
}

module.exports.getFSELabel = async function( batch_id ){
  return await fse_batches.getBatchName( batch_id );
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

module.exports.getBatchForProduct = async function( product_type ){
  return await fse_batches.getBatchForProduct( product_type );
}

module.exports.getProductBatchId = function( product_type, fse_lot, strength ){
  return products.getProductBatchId( product_type, fse_lot, strength );
}

module.exports.retireFSEBatch = async function( batch_id ){
  return await fse_batches.retireBatch( batch_id );
}

module.exports.unretireFSEBatch = async function( batch_id ){
  return await fse_batches.unretireBatch( batch_id );
}

module.exports.updateFSEMass = async function( batch_id, new_mass ){
  if( !new_mass || isNaN(parseInt(new_mass)) ) return false;
  if( new_mass < 0 ) new_mass = 0;
  return await fse_batches.updateAvailableMass( batch_id, new_mass );
}

module.exports.advanceFSELot = async function( fse, product_type ){
  if( await fse_batches.retireBatch( fse.batch_id ) ){
    let l = await fse_batches.getBatchForProduct( product_type );
    if( l ) return l;
    else return {lot_number:false, label:"Full Spectrum Extract"};
  }else{
    return false;
  }
}

module.exports.advanceIngredientLot = async function( ingredient, product_type ){
  if( await ingredients.retireIngredient( ingredient.key, ingredient.lot_number, product_type ) ){
    //log if the new lot is the last lot in inventory!
    let l = await ingredients.getCurrentLot( ingredient.key, product_type );
    //dispatch event with change
    console.log( "inventory_manager.advanceIngredientLot :: need to dispatch an event here for logging to catch and record advancement of inventory ");
    return l;
  }else{
    return false;
  }
}

module.exports.retireIngredient = async function( _id, product_type ){
  let f = await ingredients.getKeyAndLotFromId( _id );
  if( !f ) return false;
  else{
    let u = await ingredients.retireIngredient( f.key, f.lot_number, product_type );
    return u;
  }
}

module.exports.unretireIngredient = async function( _id, product_type ){
  let f = await ingredients.getKeyAndLotFromId( _id );
  if( !f ) return false;
  else{
    let u = await ingredients.unretireIngredient( f.key, f.lot_number, product_type );
    return u;
  }
}

module.exports.getIngredientList = async function( active_only ){
  if( !active_only ) active_only = false;
  else active_only = true;
  let il = await ingredients.getCurrentList( active_only );
  return il;
}

module.exports.getBatchList = async function(){
  return await fse_batches.getBatchList();
}

module.exports.pullIngredientsForRun = async function( ing, fse ){
  //ultimately need to implement rollback here if any pull fails
  if(!await fse_batches.pullFromBatch( fse.batch_id, fse.total_amount )) throw new Error("inventory_manager.pullIngredientsForRun :: couldn't pull fse for run", fse);
  for( let i in ing ){
    if( ing[i].units == GRAMS ){
      await ingredients.pullMassFromLot( ing[i].key, ing[i].lot_number, ing[i].total_amount );
    }else if( ing[i].units == MILS ){
      await ingredients.pullVolumeFromLot( ing[i].key, ing[i].lot_number, ing[i].total_amount );
    }else if( ing[i].units == OUNCES ){
      await ingredients.pullVolumeFromLot( ing[i].key, ing[i].lot_number, ozToMils(ing[i].total_amount) );
    }else{
      console.log("pullIngredientsForRun unrecognized units :: " + ing[i].units );
    }
  }
  return true;
}

module.exports.updateVolumeById = async function( _id, new_volume ){
  if( !new_volume || new_volume < 0 ) return false;
  let f = await ingredients.getKeyAndLotFromId( _id );
  if( !f ) return false;
  else{
    let u = await ingredients.updateVolume( f.key, f.lot_number, new_volume );
    return u;
  }
}

async function initialize(){
  await ingredients.initialize();
  await fse_batches.initialize();
  ( { product_key } = loadData("./services/product_key.json") );
  loadData = null;
  //create index by id for quick reference
  for( let i in product_key ){ //for each product definition
    for( let j in product_key[i] ){ //for each part of a product definition
      if( j == "product_type" || j == "strength" ) continue;
      if(  Array.isArray(product_key[i][j]) ){
        for( let k in product_key[i][j] ){ //for each ingredient
          if( product_key[i][j][k].hasOwnProperty( 'key' )){
            product_key[i][j][k].label = await ingredients.getIngredientLabel( product_key[i][j][k].key );
//            console.log(product_key[i][j][k]);
          }
        }
      }
    }
  }
}

let {loadData} = require( "../tools/filesys/filesys_util");
const fse_batches = require('./batches/fse_batches');
const products = require('./batches/product_batches');
const {GRAMS, OUNCES, MILS, ozToMils, milsToGrams } = require('../tools/unit_converter');
var product_key;
const moment = require('moment');
const ingredients = require('../services/ingredients/ingredients');
initialize();
