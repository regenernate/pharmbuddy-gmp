/**** PURPOSE ****

The purpose of this utility is to encapsulate the conversions between mils and grams using known specific specific_gravities

******/

module.exports.milsToGrams = function( mils, material ){
  material = material.toLowerCase();
  if( !specific_gravities.hasOwnProperty( material ) ){ console.log("unit_convertor.error in milsToGrams :: the material sent was not recognized " + material + "!"); return false; }
  return mils * specific_gravities[ material ];
}

module.exports.gramsToMils = function( grams, material ){
  material = material.toLowerCase();
  if( !specific_gravities.hasOwnProperty( material ) ){ console.log("unit_convertor.error in gramsToMils :: the material sent was not recognized " + material + "!"); return false; }
  return grams / specific_gravities[ material ];
}

const specific_gravities = { olive_oil:.915, hempseed_oil:.895, orange_cream_flavoring:.89, licorice_flavoring:.94, peppermint_flavoring:.895, natural:0, wpe:.9 };
