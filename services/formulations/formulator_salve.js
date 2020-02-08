
const default_oils = [ "hempseed", "sunflower", "argan" ];

module.exports.calculateIngredients = async function( ingredients, strength, extract){
  let errors = [];
  console.log(ingredients);
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  let eos = validateEssentialOils( ingredients.essential_oils, errors );
  strength = validateStrength( strength, errors );

  confirmExtract( extract, errors );

  if( errors.length ){
    throw new Error( errors.join("\n") );
  }

  let cbd_extract_percent = extract.percent_cbd;


  //salve calculations are based on number of cups of base oil desired
  //for each qty requested, use 1/3 cup argan, 1/3 cup hempseed, 1/3 cup sunflower, 1 oz beeswax


  //calculate the ingredients required, unit size = 8oz
  let cbd_per_cup = (strength/cbd_extract_percent)/1000 / extract_specific_gravity;
//  let eo_per_unit = flavoring_amount; // in ml




  //convert everything to grams
  let frm = {};
/*  frm.base_1 = { type:"hempseed", quantity:2 * valid_carriers[ carrier ]) };
  if( flav_per_unit > 0 ) frm.flavoring = { type:flavoring, quantity:(flav_per_unit * valid_flavorings[ flavoring ]) };
  frm.wpe = { id:extract.id, quantity:(cbd_per_unit * extract_specific_gravity) };
*/  return frm;

}

function validateEssentialOils( eos, errors ){
  if( eos == ORANGE || eos == PEPPERMINT_LEMON ) return eos;
  errors.push( "Essential Oil " + eos + " isn't valid." );
  return false;
}

const ORANGE = "orange";
const PEPPERMINT_LEMON = "pepplem";

function validateStrength( strength ){
  if( strength == 1 ) return 300;
  else if( strength == .5 ) return 150;
  errors.push( "Strength " + strength + " is not valid." );
  return false;
}

function confirmExtract( extr, errors ){
  if( !extr || !extr.hasOwnProperty( 'id' ) || !extr.hasOwnProperty( 'percent_cbd') ){
    errors.push( "The extraction sent was not valid // value sent was : ", extr );
  }
  return extr;
}
