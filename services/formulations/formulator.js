/********

PURPOSE : To accept a set of ingredient parameters and calculate the amount of each ingredient needed to make a run of the size requested

SCOPE : Sublingual product only

********/

const min_quantity = 1;
const max_quantity = 33;
const volume_per_item = 30; //ml

//this is an index of specific gravities for the carrier oils
const valid_carriers = {"olive":.915, "hempseed":.895};
const valid_strengths = { 300:1, 600:1, 900:1 };
//this is an index of the specific gravities of these flavorings
const valid_flavorings = {"orange_cream":.89, "licorice":.94, "peppermint":.895, "natural":0 }
const flavoring_amount = 1; // in ml

const extract_specific_gravity = .9;

const default_quantity = 1;
const default_carrier = "olive";
const default_strength = 600;
const default_flavoring = "natural";

const quantity_error = "Quantity must be a number between " + min_quantity + " and " + max_quantity + ". Used default quantity ( " + default_quantity + " ) instead.";
const carrier_error = "Carrier must be one of the following: olive, hempseed.";
const strength_error = "Strength must be one of the following: 300, 600, 900.";
const flavoring_error = "Flavoring must be one of the following: orange_cream, licorice, peppermint, natural.";

/*********    Calculating methods *********/

module.exports.calculateIngredients = async function( quantity, carrier, strength, flavoring, extract){
  let errors = [];
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  quantity = validateQuantity( quantity, errors );
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  carrier = validateCarrier( carrier, errors );
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  strength = validateStrength( strength, errors );
  //validate flavoring
  flavoring = validateFlavoring( flavoring, errors );

  if( errors.length ){
    throw new Error( errors.join("\n") );
  }

  //have to look up current cbd_extract_percent from batches, for now hard-code sublingual product
  let cbd_extract_percent = extract.percent_cbd;

  //calculate the ingredients required
  let cbd_per_unit = (strength/cbd_extract_percent)/1000 / extract_specific_gravity; // in ml
  let flav_per_unit = ( flavoring == default_flavoring ) ? 0 : flavoring_amount; // in ml
  let carr_per_unit = volume_per_item - flav_per_unit - cbd_per_unit;

  //convert everything to grams
  let frm = {};
  frm[ carrier.split(" ").join("_") ] = (carr_per_unit * valid_carriers[ carrier ]);
  frm[ flavoring.split(" ").join("_") ] = (flav_per_unit * valid_flavorings[ flavoring ]);
  frm[ "fshe_" + extract.id ] = (cbd_per_unit * extract_specific_gravity);
  return { formula:frm, units:"g" };
}


/**********   VALIDATORS FOR INGREDIENTS   ************/

//validation methods simply confirm value sent is ok and then either push errors onto error stack and return default value OR return valid value as sent
function validateQuantity( qty, errors ){
  if( !qty ) qty = default_quantity;
  if( isNaN(qty) || qty < min_quantity || qty > max_quantity ){
    errors.push( quantity_error + " // value sent was : " + qty );
    return default_quantity;
  }else {
    return qty;
  }
}

//validation methods simply confirm value sent is ok and then either push errors onto error stack and return default value OR return valid value as sent
function validateCarrier( carr, errors ){
  if( !carr ) carr = default_carrier;
  else carr = carr.toLowerCase();
  if( !valid_carriers.hasOwnProperty( carr ) ){
    errors.push( carrier_error + " // value sent was : " + carr );
    return default_carrier;
  }else {
    return carr;
  }
}

//validation methods simply confirm value sent is ok and then either push errors onto error stack and return default value OR return valid value as sent
function validateStrength( str, errors ){
  if( !str ) str = default_strength;
  if( !valid_strengths.hasOwnProperty( str ) ){
    errors.push( strength_error + " // value sent was : " + str );
    return default_strength;
  }else {
    return str;
  }
}


function validateFlavoring( flav, errors ){
  if( !flav ) flav = default_flavoring;
  else flav = flav.toLowerCase();
  if( !valid_flavorings.hasOwnProperty( flav ) ){
    errors.push( flavoring_error + " // value sent was : " + flav );
    return default_flavoring;
  }else{
    return flav;
  }
}
