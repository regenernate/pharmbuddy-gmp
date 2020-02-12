
module.exports.createFormula = async function( request, extract ){
  let errors = [];
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  let eos = validateEssentialOils( request.scent, errors );
  let strength = validateStrength( request.strength, errors );

  confirmExtract( extract, errors );

  if( errors.length ){
    throw new Error( errors.join("\n") );
  }

  let cbd_extract_percent = extract.percent_cbd;
  let frm = { ingredients:[] };
  for( let i in BASE_OILS ){
    frm.ingredients.push( {key:BASE_OILS[i], amount:8, units:'oz'} ); //add 1cup of each base oil in oz
  }
  frm.ingredients.push( {key:BEESWAX, amount:3, units:'oz'}); //add beeswax 1oz per cup of base oil in oz
  let total_mls = 0;
  for( let i in frm.ingredients ){
    total_mls += frm.ingredients[i].amount*MLS_PER_OZ;
  }
  let mls_eo = EO_MLS_PER_OZ*(total_mls/MLS_PER_OZ);
  frm.ingredients.push( {key:eos, amount:mls_eo, units:'ml'} ); //add e.o. in mls
  total_mls += mls_eo;
  let cbd_per_unit = ( strength/cbd_extract_percent/MLS_PER_OZ );
  frm.wpe = { key:extract.key, amount:precisify(cbd_per_unit * total_mls /1000), units:'g' }; //add wpe in g
  return frm;
}

/********


should be pulling valid essential oils from the inventory here , etc.


******/

const extract_specific_gravity = .9;
const BASE_OILS = ["hempseed_oil","argan_oil","sunflower_seed_oil"];
const BEESWAX = "beeswax";

const EO_MLS_PER_OZ = .25/8;
const MLS_PER_OZ = 29.5635;
const ORANGE = "orange_eo";
const PEPPERMINT = "peppermint_eo";

const {precisify} = require('../../tools/unit_converter');

function validateEssentialOils( eos, errors ){
  if( eos == ORANGE || eos == PEPPERMINT ) return eos;
  errors.push( "Essential Oil " + eos + " isn't valid." );
  return false;
}

function validateStrength( strength, errors ){
  if( strength == 300 || strength == 150 ) return strength;
  errors.push( "Strength " + strength + " is not valid." );
  return false;
}

function confirmExtract( extr, errors ){
  if( !extr || !extr.hasOwnProperty( 'key' ) || !extr.hasOwnProperty( 'percent_cbd') ){
    errors.push( "The extraction sent was not valid // value sent was : ", extr );
  }
  return extr;
}
