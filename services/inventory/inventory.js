const FSHE = "fshe";


module.exports.checkInventory = async function( request, amounts ){
  //iterate over items and check if there is enough inventory for each
  let r = {};
  //return an object with same keys indicating inventory status
  for( let i in amounts ){
    let l = getCurrentLot( i );
    if( !l ) continue;
    else if( amounts[i] > l.current_mass ){
      r[ i ] = l.current_mass - amounts[i];
    }else{
      r[ i ] = l.lot_number;
    }
  }
  return r;
}

module.exports.getUnitsAvailable = async function( item, amount_per_unit ){
  if( amount_per_unit == 0 ) return false;
  let i = getCurrentLot( item, amount_per_unit );
  if(!i) throw new Error("inventory.error in getUnitsAvailable :: Item requested from inventory that doesn't exist. ", item);
  let max_units = Math.floor(i.current_mass / amount_per_unit);
  return { lot_number:i.lot_number, max_units:Math.floor(i.current_mass / amount_per_unit) };
}

module.exports.pullInventory = function( item, lot_number, amount ){
  let lot = getItemByLot( item, lot_number );
  if( lot ){
    lot.current_mass -= amount;
    if( lot.current_mass < 0 ) lot.current_mass = 0;
    return true;
  }
  return false;
}

module.exports.retireInventory = function( item, lot_number ){
  let lot = getItemByLot( item, lot_number );
  if( lot ){
    lot.current_mass = 0;
    lot.retired_date = moment().format('x');
    return true;
  }
  return false;
}

const {milsToGrams} = require( "../../tools/unit_converter");
let {loadData} = require( "../../tools/filesys/filesys_util");
var inventory_list;

function initialize(){
  //use filesys_util to load the data
  inventory_list = loadData("./services/inventory/data/inventory.json").inventory_list;
  loadData = null;
  for( let i in inventory_list ){
    let l = inventory_list[i].lots;
    if( l[0].hasOwnProperty( "current_mass" ) ) continue;
    for( let j = 0; j<l.length; j++){
      l[j].initial_mass = milsToGrams( l[j].initial_volume, i );
      l[j].current_mass = milsToGrams( l[j].current_volume, i );
    }
  }
}

initialize();

function getCurrentLot( item, min_quantity ){
  if( !min_quantity ) min_quantity = 0;
  let ik = item.split(" ").join("_");
  if( inventory_list.hasOwnProperty(ik) ){
    let l = inventory_list[ik].lots.length;
    for( let i = 0; i<l; i++ ){
      if( inventory_list[ik].lots[i].current_mass > min_quantity ){
        return inventory_list[ik].lots[i];
      }
    }
  }
  return false;
}

function getItemByLot( item, lot_number ){
  let ik = item.split(" ").join("_");
  if( inventory_list.hasOwnProperty( ik ) ){
    let lots = inventory_list[ik].lots;
    for( let i in lots ){
      if( lots[i].lot_number == lot_number ){
        return lots[i];
      }
    }
  }
  return false;
}
