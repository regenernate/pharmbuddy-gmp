
//make remote call posting required data ( device name ) to get back a registration code

const prod_url = "cgmp.ravenridgefamilyfarm.com";
const prod_port = 443;
const dev_url = "localhost";
const dev_port = 3200;

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

const http = ( prod ) ? require('https') : require('http');

const data = "device_name=" + encodeURIComponent(valid_devices[ device ]);

var options = {
  hostname: base_url,
  port: port,
  path: '/register/get_registration_code',
  method: 'POST',
  headers: {
       'Content-Type': FORM_URLENCODED,
       'Content-Length': data.length
     }
};

var req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);

  res.on('data', (d) => {
    output(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();

function output(d){
  let jd = JSON.parse( d );
  console.log( "Visit the following url to use this registration code:" );
  console.log( base_url + ( ( prod ) ? "" : ":" + port ) + "/register/" + jd.registration_code );
  console.log( "And be sure to select the proper device ( " + jd.device_name + " )!" );
}
