
module.exports.createFormula = async function( request, extract ){
  let errors = [];
  //ensure array format whether one or more scents is being sunflower_seed_oil
  let scent = ( typeof( request.scent ) == "string" ) ? request.scent.split(',') : request.scent;
  //validate quantity, expect error pushed onto stack plus replacement of quantity with default value, or return = quantity sent ( i.e. valid )
  let eos = validateEssentialOils( scent, errors );
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
    total_mls += frm.ingredients[i].amount*MILS_PER_OZ;
  }
  let mls_eo = EO_MILS_TO_USE_PER_OZ*(total_mls/MILS_PER_OZ);
  for( let i in eos ){
    frm.ingredients.push( {key:eos[i], amount:mls_eo, units:'ml'} ); //add e.o. in mls
  }
  total_mls += mls_eo * eos.length; //add the total mls of EO used based on how many scents are in this formulation
  let cbd_per_unit = ( strength/cbd_extract_percent/MILS_PER_OZ );
  frm.fse = { batch_id:extract.batch_id, amount:precisify(cbd_per_unit * total_mls /1000), units:'g' }; //add fse in g
  return frm;
}

/********


should be pulling valid essential oils from the inventory here , etc.


******/

const extract_specific_gravity = .9;
const BASE_OILS = ["hempseed_oil","argan_oil","sunflower_seed_oil"];
const BEESWAX = "beeswax";

const EO_MILS_TO_USE_PER_OZ = .25/8;

const ORANGE = "orange_essential_oil";
const PEPPERMINT = "peppermint_essential_oil";
const LEMON = "lemon_essential_oil";

const {precisify, MILS_PER_OZ} = require('../../tools/unit_converter');

function validateEssentialOils( eos, errors ){
  let err = false;
  for( let i in eos ){
    if( eos[i] != ORANGE && eos[i] != PEPPERMINT && eos[i] != LEMON ){
      errors.push( "Essential Oil " + eos + " isn't valid." );
      err = true;
    }
  }
  if( err ) return false;
  else return eos;
}

function validateStrength( strength, errors ){
  if( strength == 300 || strength == 600 ) return strength;
  errors.push( "Strength " + strength + " is not valid." );
  return false;
}

function confirmExtract( extr, errors ){
  if( !extr || !extr.hasOwnProperty( 'batch_id' ) || !extr.hasOwnProperty( 'percent_cbd') ){
    errors.push( "The extraction sent was not valid // value sent was : ", extr );
  }
  return extr;
}
