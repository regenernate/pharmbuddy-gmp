
//make remote call posting required data ( device name )

const prod_url = "cgmp.ravenridgefamilyfarm.com";
const prod_port = 80;
const dev_url = "localhost";
const dev_port = 3000;

const valid_devices = [
  "the Basement 27\" iMac",
  "your phone ( or tablet )",
  "Nate's iMac",
  "Nate's macbookPro",
  "the iMac in Dad's office"
];

if( process.argv.length < 3 ){ console.log("You need to send a valid device number as the first parameter, or 'list' to see all device numbers."); process.exit(); }
if( process.argv[ 2 ] == "list" ){
  for( let i=0; i<valid_devices.length; i++ ){
    console.log( "use \"" + (i+1) + "\" for " + valid_devices[i] );
  }
  process.exit();
}

let device = process.argv[ 2 ];
if( isNaN( device ) || device < 1 || device > valid_devices.length ){ console.log("Device number sent must be between 1 and " + valid_devices.length + "." ); process.exit(); }
device--;

let prod = process.argv.length > 3;
let base_url = ( prod ) ? prod_url : dev_url; //default to testing against dev, but send any fourth param at all and it will send to production
let port = ( prod ) ? prod_port : dev_port;

const FORM_URLENCODED = 'application/x-www-form-urlencoded';
const https = require('http');

const data = "device_name=" + encodeURIComponent(valid_devices[ device ]);

const options = {
  hostname: base_url,
  port: port,
  path: '/register/get_registration_code',
  method: 'POST',
  headers: {
    'Content-Type': FORM_URLENCODED,
    'Content-Length':data.length
  }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    let jd = JSON.parse( d );
    console.log( "Visit the following url to use this registration code:" );
    console.log( base_url + ( ( prod ) ? "" : ":" + port ) + "/register/" + jd.registration_code );
    console.log( "And be sure to select the proper device ( " + jd.device_name + " )!" );
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data);
req.end();
