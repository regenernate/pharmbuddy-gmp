
/**** PURPOSE ****

The purpose of this utility is to convert times between milliseconds and human readible time for develoment purposes.

********/

let moment = require('moment');

let from = "YYYYMMDD";
let to = "x";

if( process.argv.length > 3 ){
  from = process.argv[3];
  to = process.argv[4];
}else if( process.argv.length < 3 ){
  //output valid formats
  console.log( "To convert times, use time.js {value_to_convert} {from_format} {to_format}");
  console.log( "{from_format} and {to_format} are optional and default to YYYY-MM-DD and x");
//  console.log( "YYYY-MM-DD hh:mm:ss\nx" );
  return;
}

console.log( process.argv[2] + " is " + moment(process.argv[2], from).format(to) );
