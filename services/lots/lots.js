
module.exports.createRun = function( product_type, strength, ingredients, units_made ){
  //generate unique key for ingredients sent
  let lk = getLotKey( ingredients );
  //check current lots for a match to
  let lot_id = getLotId( lk, product_type );
  let run_id = addRunToLot( lot_id, product_type, strength, units_made, ingredients );
  console.log(lots_by_product_type);
  return { lot_id:lot_id, run_id:run_id };
}

module.exports.getRun = function( run_id ){
  if( run_index.hasOwnProperty( run_id ) ) return getPublicObject( run_index[run_id] );
}

//for now return full object without copying
function getPublicObject( run ){
  return run;
}

function getLotKey( ingredients ){
  ingredients.sort( ( a, b ) => {
    return ( a.ingredient > b.ingredient ) ? -1 : 0;
  });
  let k = [];
  for( let i=0; i<ingredients.length; i++ ){
    k[i] = ingredients[i].ingredient.split(" ").join("_") + "(" + ingredients[i].lot_number + ")";
  }
  return k.join("||");
}

function getLotId( lot_key, product_type ){
  //find matching existing lot
  let lots = lots_by_product_type[ product_type ];
  for( let i in lots ){
    if( lots[i].lot_key == lot_key ){
      return lots[i].lot_id;
    }
  }
  //otherwise make a new lot
  return createLot( lot_key, product_type );
}

function createLot( lot_key, product_type ){
  let id = next_lot_id++;
  lots_by_product_type[ product_type ].push( { lot_id:id, lot_key:lot_key, runs:[] } );
  return id;
}

function addRunToLot( lot_id, product_type, strength, units_made, ingredients ){
  let lots = lots_by_product_type[ product_type ];
  for( let i in lots ){
    if( lots[i].lot_id == lot_id ){
      let id = next_run_id++;
      run_index[ id ] = { run_id:id, lot_id:lot_id, product_type:product_type, run_date:moment().format('x'), strength:strength, units_made:units_made, ingredients:ingredients };
      lots[i].runs.push( run_index[id] );
      return id;
    }
  }
  return false;
}

var next_lot_id = 2;
var next_run_id = 4;
var run_index = {};

const moment = require('moment');

var lots_by_product_type = {
  sublingual:
    [
    ],
  salve:[
    ]
  };
