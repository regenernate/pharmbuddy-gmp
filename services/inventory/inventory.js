const FSHE = "fshe";


module.exports.checkInventory = async function( request, amounts ){
  //iterate over items and check if there is enough inventory for each
  let r = {};
  console.log(request);
  console.log("and...");
  console.log(amounts);
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

module.exports.pullInventory = async function( request, amounts ){
  //actually decrement the inventory counts for each item in the request

}

//use filesys_util to load the data
let {loadData} = require( "../../tools/filesys/filesys_util");
var { inventory_list, units_volume } = loadData("./services/inventory/data/inventory.json");
loadData = null;

const {milsToGrams} = require( "../../tools/unit_converter");

for( let i = 0; i< inventory_list.length; i++ ){
  let l = inventory_list[i].lots;
  if( l[0].hasOwnProperty( "current_mass" ) ) continue;
  for( let j = 0; j<l.length; j++){
    l[j].initial_mass = milsToGrams( l[j].initial_volume, i );
    l[j].current_mass = milsToGrams( l[j].current_volume, i );
  }
}

function getCurrentLot( item ){
  let ik = item.split(" ").join("_");
  if( inventory_list.hasOwnProperty(ik) ){
    let l = inventory_list[ik].lots.length;
    for( let i = 0; i<l; i++ ){
      if( inventory_list[ik].lots[i].current_mass > 0 ){
        return inventory_list[ik].lots[i];
      }
    }
  }
  return false;
}
