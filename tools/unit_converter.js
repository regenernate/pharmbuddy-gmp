/**** PURPOSE ****

The purpose of this utility is to encapsulate the conversions between mils and grams using known specific specific_gravities

******/

module.exports.precisify = function( num, zeroes ){
  if( !num ) return 0;
  if( !zeroes || isNaN( zeroes ) ) zeroes = 1000;
  return Math.floor( num * zeroes ) / zeroes;
}

module.exports.milsToGrams = function( mils, material ){
  material = material.toLowerCase().split(" ").join("_");
  if( !specific_gravities.hasOwnProperty( material ) ){ console.log("unit_converter.error in milsToGrams :: the material sent was not recognized " + material + "!"); return false; }
  return mils * specific_gravities[ material ];
}

module.exports.gramsToMils = function( grams, material ){
  material = material.toLowerCase().split(" ").join("_");
  if( !specific_gravities.hasOwnProperty( material ) ){ console.log("unit_converter.error in gramsToMils :: the material sent was not recognized " + material + "!"); return false; }
  return grams / specific_gravities[ material ];
}

module.exports.ozToMils = function( oz ){
  return oz * MILS_PER_OZ;
}

module.exports.mlsToOz = function( mls ){
  return mls / MILS_PER_OZ;
}

const specific_gravities = { sunflower_seed_oil:.925, olive_oil:.915, hempseed_oil:.895,
  orange_cream_flavoring:.89, licorice_flavoring:.94, peppermint_flavoring:.895,
  wpe:.9, lemon_eo:.85, orange_eo:.85, peppermint_eo:.898, argan_oil:.912, beeswax:.968 };

const MILS_PER_OZ = 29.5635;

module.exports.MILS_PER_OZ = MILS_PER_OZ;
module.exports.MILS = "ml";
module.exports.OUNCES = "oz";
module.exports.GRAMS = "g";
