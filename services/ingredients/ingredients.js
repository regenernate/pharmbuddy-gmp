
var ds = require("../../tools/data_persistence/mongostore");
const ingredients_collection = "ingredients";
const {milsToGrams, gramsToMils, precisify } = require( "../../tools/unit_converter");
const moment = require('moment');
var lots;
var label_key = {};

async function initialize(){
  if(lots) return true;
  lots = await ds.collection(ingredients_collection);
  await buildLabelKey();
  return true;
}

async function buildLabelKey(){
  let lc = await lots.find({});
  while(await lc.hasNext()){
    let item = await lc.next();
    if( item != null ){
      label_key[item.key] = item.label;
      if( item.current_volume < 0 ){ console.log('ingredients.initialize, updating negative volume'); lots.updateOne({_id:item._id}, {$set:{current_volume:0}}) };
    }
  };
}


module.exports.initialize = initialize;

module.exports.getAllInventoryFor = async function( key ){
  let f = await lots.find({key:key}).sort({retired_date:1, expiration_date:1});
  let r = [];
  while( await f.hasNext() ){
    let i = await f.next();
    if( i ) r.push(i);
  }
  return r;
}

module.exports.getIngredientLabel = async function( key ){
  if( label_key.hasOwnProperty(key) ) return label_key[key];
  else return false;
}

module.exports.addLot = async function( key, lot ){
  lot.key = key;
  if( label_key.hasOwnProperty( key ) ) lot.label = label_key[ key ];
  else if( lot.hasOwnProperty( "label" ) ) label_key[ key ] = lot.label;
  else throw new Error( 'Ingredients.addLot :: Can not add lot without label.' );
  let f = await lots.find({key:key, lot_number:lot.lot_number});
  let fc = await f.count();
  if( fc > 0 ) throw new Error( 'Ingredients.addLot :: There is already a ' + key + ' with lot number ' + lot.lot_number );
  cleanQuantities( lot );
  //validate lot properties sent
  let plist = ['do_not_use_for', 'key', 'label','lot_number', 'initial_volume', 'current_volume', 'expiration_date', 'purchase_date', 'purchased_from'];
  for( let i in lot ){
    if( plist.indexOf( i ) < 0 ) throw new Error("Invalid property sent to ingredients.addLot :: " + i);
  }
  for( let i in plist ){
    if( !lot.hasOwnProperty( plist[i] ) ){
      if( plist[i] == 'do_not_use_for' ) lot.do_not_use_for = [];
      else throw new Error("Missing property in ingredients.addLot :: " + plist[i] );
    }
  }
  let i = await lots.insertOne(lot);
  console.log("ingredients.addLot :: added " + i.insertedCount);
  return i.insertedCount;
}

module.exports.deleteLot = async function( key, lot_number ){
  let d = await lots.delete( {key:key, lot_number:lot_number} );
  console.log("ingredients.deleteLot :: removed " + d.deletedCount);
  return ( d.deletedCount > 0 );
}

module.exports.updateVolume = updateVolume;

async function updateVolume( key, lot_number, new_volume ){
  let i = await lots.updateOne( {key:key, lot_number:lot_number}, {$set:{current_volume:new_volume}});
  return i.modifiedCount > 0;
}

module.exports.updateMass = async function( key, lot_number, new_mass ){
  let v = gramsToMils( new_mass, key );
  return updateVolume( key, lot_number, v );
}

module.exports.pullVolumeFromLot = pullVolume;

async function pullVolume( key, lot_number, volume ){
  let i = await lots.findOne( {key:key, lot_number:lot_number} );
  if( i ){
    let u = {};
    u.current_volume = i.current_volume - volume;
    if( u.current_volume < 0 ) { u.current_volume = 0; }
    let up = await lots.updateOne( {_id:i._id}, {$set:u} );
    return up.modifiedCount == 1;
  }else{
    return false;
  }
}

module.exports.pullMassFromLot = async function( key, lot_number, mass ){
  let v = gramsToMils( mass, key );
  return await pullVolume( key, lot_number, v );
}

module.exports.retireIngredient = async function( key, lot_number, product_type ){
  let s = {key:key, lot_number:lot_number};
  let i = await lots.findOne( s );
  if( i ){
    let u;
    if( product_type && i.current_volume > 0 ){
      let ptarray = [];
      if( i.hasOwnProperty('do_not_use_for') ) ptarray = i.do_not_use_for;
      if( ptarray.indexOf( product_type ) >= 0 ) return true;
      else ptarray.push(product_type);
      u = await lots.updateOne( s, {$set:{do_not_use_for:ptarray}});
    }
    else u = await lots.updateOne( s, {$set:{retired_date:moment().format('x')}});
    return u.modifiedCount > 0;
  }else{
    return false;
  }
}

module.exports.unretireIngredient = async function( key, lot_number, product_type ){
  let f = {key:key, lot_number:lot_number};
  let ptarray = [];
  if( product_type ){
    let fnd = await lots.findOne( f );
    if( fnd.hasOwnProperty('do_not_use_for') ){
      for( let j in fnd.do_not_use_for ){
        if( fnd.do_not_use_for[j] != product_type ) ptarray.push(fnd.do_not_use_for[j]);
      }
    }
  }
  let u = await lots.updateOne( {key:key, lot_number:lot_number}, {$unset:{retired_date:1}, $set:{do_not_use_for:ptarray}});
  return u.modifiedCount > 0;
}

module.exports.getItem = async function( key, lot_number ){
  let i = await lots.findOne({key:key, lot_number:lot_number});
  return i;
}

module.exports.getCurrentLot = async function( key, product_type ){
  let f = { key:key, retired_date:null };
  if( product_type ) f.do_not_use_for = {$ne:product_type};
  let i = await lots.find(f).sort({expiration_date:1});
  if( await i.hasNext()) {
    return await i.next();
  }else{
    return false;
  }
}

module.exports.getCurrentList = async function( active_only ){
  let fnd = active_only ? {retired_date : { $exists:false }} : {};
  let f = await lots.find(fnd).sort({key:1, expiration_date:1});
  let rtn = [];
  let itm;
  while(await f.hasNext()){
    itm = await f.next();
    if( itm ) rtn.push( itm );
  }
  return rtn;
}

async function getKeyAndLotFromId( _id ){
  let uid = ds.getObjectId( _id );
  let f = await lots.findOne({_id:uid}, {projection:{ key:1, lot_number:1 }});
  if( !f ) throw new Error('ingredients.getKeyAndLotFromId :: ' + _id + " couldn't be found.");
  return f;
}

module.exports.getKeyAndLotFromId = getKeyAndLotFromId;

function cleanQuantities( item ){
  if( item.initial_volume <= 0 || isNaN( item.initial_volume ) ){
    console.log( "Ingredient.js :: initial_volume was not a positive number :: ", item );
    item.initial_volume = 0;
  }
  if( item.current_volume <= 0 || isNaN( item.current_volume ) ) item.current_volume = item.initial_volume;
  precisify( item.initial_volume );
  precisify( item.current_volume );
}
