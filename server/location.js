
module.exports.location = function( lat, long, acc ){
    return { latitude:formatCoordinate(lat), longitude:formatCoordinate(long), accuracy:formatAccuracy(acc) };
}

//format for 9,6 decimal
function formatCoordinate( value ){
  value = value.toString();
  let di = value.indexOf(".");
  let da = ( di >= 0 ) ? 7 : 6;
  return value.substring(0, di + da);
}

//format for 10,2 decimal
function formatAccuracy( value ){
  value = value.toString();
  let di = value.indexOf(".");
  let da = ( di >= 0 ) ? 3 : 2;
  return value.substring(0, di + da);
}
