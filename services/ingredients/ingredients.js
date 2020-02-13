
module.exports.getIngredientLot = function( item_key ){
  let ing = getIngredient( item_key );
  let lot = getCurrentLot( ing );
  if(!lot){
    return { key:item_key, lot_number:false };
  }
  else {
    return { key:item_key, lot_number:lot.lot_number };
  }
}

//remove amount of ingredient from the item type and lot number sent
//expects grams
module.exports.pullMassFromLot = function( item_key, lot_number, amount ){
//  console.log("Ingredient.pullIngredient :: " + item_key + " : " + lot_number + " : " + amount );
  let lot = getItemLot( getIngredient( item_key ), lot_number );
//  console.log("beginning mass :: " + lot);
  if( lot ){
    lot.current_mass = lot.current_mass - amount;
    if( lot.current_mass <= 0 ){
      lot.current_mass = 0;
      lot.retired_date = moment().format('x');
    }
    lot.current_volume = gramsToMils(lot.current_mass, item_key);
//    console.log("ending mass :: " + lot.current_mass );
    return true;
  }
  return false;
}

//expects mls
module.exports.pullVolumeFromLot = function( item_key, lot_number, amount ){
  let lot = getItemLot( getIngredient( item_key ), lot_number );
//  console.log("beginning mass :: " + lot);
  if( lot ){
    lot.current_volume = lot.current_volume - amount;
    if( lot.current_volume <= 0 ){
      lot.current_volume = 0;
      lot.retired_date = moment().format('x');
    }
    lot.current_mass = milsToGrams(lot.current_volume, item_key);
//    console.log("ending mass :: " + lot.current_mass );
    return true;
  }
  return false;
}

/***** zero out ingredient for given itemkey and lot number  ******/
module.exports.retireIngredient = function( item_key, lot_number ){
  //console.log("ingredient.retireIngredient :: " + item_key + " : " + lot_number );
  let lot = getItemLot( getIngredient( item_key ), lot_number );
  if( lot ){
    lot.retired_date = moment().format('x');
    return true;
  }
  return false;
}

/***** this needs to return an object which isn't the actual physical ingredient object *******/
module.exports.getIngredientList = function(){
  return ingredient_key;
}

module.exports.getIngredientName = function( item_key ){
  let i = getIngredient( item_key );
  if( i ) return i.name;
  else return false;
}

module.exports.getAvailableMass = function( item_key, lot_number ){
  let lot = getItemLot( getIngredient( item_key ), lot_number )
  return {key:item_key, lot_number:lot_number, mass:lot.current_mass, warning_level:( lot.current_mass / lot.initial_mass <= WARNING_PERCENT ) };
}

module.exports.getAvailableVolume = function( item_key, lot_number ){
  let lot = getItemLot( getIngredient( item_key ), lot_number )
  return {key:item_key, lot_number:lot_number, volume:lot.current_volume, warning_level:( lot.current_volume / lot.initial_volume <= WARNING_PERCENT ) };
}

/***** base getters for items and lots ******/
function getIngredient( item_key ){
  if( ingredient_key.hasOwnProperty( item_key ) ){
    return ingredient_key[ item_key ];
  }else{
    return false;
  }
}

function getCurrentLot( item ){
  if( !item || !item.lots ) return false;
  let l = item.lots.length || 0;
  for( let i = 0; i<l; i++ ){
    if( !item.lots[i].retired_date ){
      return item.lots[i];
    }
  }
  return false;
}

function getItemLot( item, lot_number ){
  if( !item || !item.lots ) return false;
  let l = item.lots.length || 0;
  for( let i = 0; i<l; i++ ){
    if( item.lots[i].lot_number == lot_number ){
      return item.lots[i];
    }
  }
  return false;
}

/****** initialization and data loading *******/

function initialize(){
  //use filesys_util to load the data
  ingredient_list = loadData("./services/ingredients/data/ingredients.json").ingredient_list;
  loadData = null;
  for( let i in ingredient_list ){
    //put it in the key
    ingredient_key[ ingredient_list[i].item_key ] = { key:ingredient_list[i].item_key, lots:ingredient_list[i].lots, name:ingredient_list[i].item_name };

    let l = ingredient_list[i].lots;
    //convert volume to mass if there isn't already a mass stored
    for( let j = 0; j<l.length; j++){
      cleanQuantities( l[j] );
      l[j].initial_mass = precisify(milsToGrams( l[j].initial_volume, ingredient_list[i].item_key ), PRECISION);
      if( !l[j].hasOwnProperty( "current_mass" ) ){
        l[j].current_mass = precisify(milsToGrams( l[j].current_volume, ingredient_list[i].item_key ), PRECISION);
      }
    }
//    console.log( ingredient_key[ingredient_list[i].item_key] );
  }
}

function cleanQuantities( item ){
  if( item.initial_volume <= 0 || isNaN( item.initial_volume ) ){
    console.log( "Ingredient.js :: initial_volume was not a positive number :: ", item );
    item.initial_volume = 0;
  }
  if( item.current_volume <= 0 || isNaN( item.current_volume ) ) item.current_volume = item.initial_volume;
  precisify( item.initial_volume, PRECISION );
  precisify( item.current_volume, PRECISION );
}

const moment = require('moment');
const WARNING_PERCENT = .1;
const PRECISION = 1000;
const {milsToGrams, gramsToMils, precisify } = require( "../../tools/unit_converter");
let {loadData} = require( "../../tools/filesys/filesys_util");
var ingredient_list;
var ingredient_key = {};
initialize();
