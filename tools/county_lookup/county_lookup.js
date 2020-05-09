
let fsu = require( "../filesys/filesys_util");

let data = fsu.loadFiles( {counties:"./tools/county_lookup/counties_by_city.csv"} );

let d = data.counties.split( "\n");

var cities = {};

for( let i in d ){
  d[i] = d[i].split("\"").join(""); //splice out any extra quotes
  let s = d[i].split(",");
  s.unshift(); //remove zipcode
  let county = s.pop().split("\r")[0];
  s.pop(); //remove state
  for( let j in s ){
    let c = s[j].trim().toLowerCase(); //clean up city name
    if( c.length > 0 ) cities[ c ] = county;
  }
}

module.exports.getCountyByCity = function( city ){
  city = city.toLowerCase();
  if( cities.hasOwnProperty( city ) ) return cities[city];
  else{
    console.log("county_lookup.js - Could not find city :: ", city);
    return "Unknown city ( " + city + " )";
  }
}
