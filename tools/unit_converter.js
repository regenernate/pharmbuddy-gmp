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

const specific_gravities = { olive:.915, hempseed:.895, orange_cream:.89, licorice:.94, peppermint:.895, natural:0, fshe:.9 };
