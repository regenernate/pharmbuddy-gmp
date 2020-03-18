/********

PURPOSE : To accept a set of ingredient parameters and calculate the amount of each ingredient needed to make a run of the size requested

SCOPE : Sublingual product only

********/

const volume_per_item = 30; //ml

//this is an index of specific gravities for the carrier oils
const valid_carriers = {"olive_oil":.915, "hempseed_oil":.895};
const valid_strengths = { 300:1, 600:1, 900:1 };
//this is an index of the specific gravities of these flavorings
const valid_flavorings = {"orange_cream_flavoring":.89, "licorice_flavoring":.94, "peppermint_flavoring":.895, "natural":0 }
const flavoring_amount = 1; // in ml

const extract_specific_gravity = .9;

const default_carrier = "olive_oil";
const default_strength = 600;
const default_flavoring = "natural";

const carrier_error = "Carrier must be one of the following: olive, hempseed.";
const strength_error = "Strength must be one of the following: 300, 600, 900.";
const flavoring_error = "Flavoring must be one of the following: orange_cream, licorice, peppermint, natural.";
const extract_error = "Extract must have batch_id.";

/*********    Calculating methods *********/

module.exports.createFormula = async function( request, extract ){
  let errors = [];

  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  let carrier = validateCarrier( request.carrier, errors );
  //validate flavoring
  let flavoring = validateFlavoring( request.flavoring, errors );
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  let strength = validateStrength( request.strength, errors );

  confirmExtract( extract, errors );

  if( errors.length ){
    throw new Error( errors.join("\n") );
  }

  //have to look up current cbd_extract_percent from batches
  let cbd_extract_percent = extract.percent_cbd;

  //calculate the ingredients required
  let cbd_per_unit = (strength/cbd_extract_percent)/1000 / extract_specific_gravity; // in ml
  let flav_per_unit = ( flavoring == default_flavoring ) ? 0 : flavoring_amount; // in ml
  let carr_per_unit = volume_per_item - flav_per_unit - cbd_per_unit;

  //convert everything to grams
  let frm = {};
  frm.ingredients = [{ key:carrier, amount:(carr_per_unit * valid_carriers[ carrier ]), units:'g' }];
  if( flav_per_unit > 0 ) frm.ingredients.push({ key:flavoring, amount:(flav_per_unit * valid_flavorings[ flavoring ]), units:'g' });
  frm.wpe = { batch_id:extract.batch_id, amount:(cbd_per_unit * extract_specific_gravity), units:'g'};
  return frm;
}


/********


should be pulling valid essential oils from the inventory or checking against inventory here , etc.


******/


/**********   VALIDATORS FOR INGREDIENTS   ************/

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

function confirmExtract( extr, errors ){
  if( !extr || !extr.hasOwnProperty( 'batch_id' ) || !extr.hasOwnProperty( 'percent_cbd') ){
    errors.push( extract_error + " // value sent was : ", extr );
  }
  return extr;
}
