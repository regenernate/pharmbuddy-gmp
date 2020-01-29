

/*********

The purpose of this router is to accept and manage requests to register user devices.


*********/


module.exports.base_route_path = "register";

const fs = require('fs');
const moment = require('moment');

const cookie_name = "registration";
const {setCookie, getCookie} = require('../tools/cookies/cookie_util');

const redirect_path = "/login/";

const bro = require('../server/bro');
const crypto = require('crypto');
const { executeTemplate, compileTemplates } = require('../views/template_manager');

const dir = "./views/mains/";
const view_extension = ".handlebars";

//this is a hash of which views to load, and what route to serve them to
var views = { confirm_device:"register", registered:"confirm_device" };
//load views and compile them
var pages = compileTemplates( { confirm_device:dir + "confirm_device" + view_extension, registered:dir + "registered" + view_extension }, true);

const valid_devices = [
  "the Basement 27\" iMac",
  "your phone ( or tablet )",
  "Nate's iMac",
  "Nate's macbookPro",
  "the iMac in Dad's office"
];

const default_device = valid_devices[1];

//this will store registration codes
var registration_codes = [];
//for now create a registration code for each device for testing
for( let i in valid_devices ){
  console.log( "REGISTRATION CODE FOR " + valid_devices[i] + " IS " + generateRegistrationCode( valid_devices[i] ) );
}

/***** create unique registration code  *****/
function generateRegistrationCode( device_name ){
  if( isValidDevice( device_name ) ){
    removeRegistrationCodeFor( device_name );
    let c = generateCode( device_name );
    registration_codes.push( { device_name:device_name, code:c } );
    return c;
  }
  return false;
}

/***** get and set registration cookies ***/
function getRegistrationCookie( req ){
  return getCookie( req, cookie_name );
}

function setRegistrationCookie( res, ro ){
  return setCookie( res, cookie_name, JSON.stringify(ro), true );
}

//main request handler
module.exports.router = async function( req, res, path ) {

  if(!path) path = [''];
  let rtn;

  let reg_cookie = getRegistrationCookie( req );

  if( reg_cookie == false ){ //this device is not yet registered
    if( path[0] !== "confirm" ){ //assume registration attempt
      //step 1 :: ask for device name
      let rc = path[0]; //registration code is the first segment of the path
      console.log("/**********  REGISTRATION ATTEMPT FOR " + rc + " AT " + moment().format() + " ********/");
      //cheat to see if this registration code is valid
      let expected_name = getDeviceNameForCode( rc );
      if( expected_name ){ //its a valid code
        //serve up page with the device choices
        rtn = executeTemplate( pages.confirm_device, {registration_code:rc, devices:valid_devices}, "logged_out" );
      }else{
        //this is an invalid code
        rtn = executeTemplate( null, "You did not send a valid registration code ( " + rc + ")." );
      }
    }else{ //this is a registration confirmation attempt
      //step 2 :: confirm device name matches registration code
      if( req.body ){ //must have post data
        let d = req.body.device_name;
        let rc = req.body.registration_code;
        //remove device code ( if it exists )
        let ro = removeRegistrationCode( rc );
        if( !ro ){ // this registration code didn't exist in the system
          rtn = executeTemplate(null, "The registration code is not valid! ( " + rc + " ).", "logged_out");
        }else if( ro.device_name == d ){ //this registration code exists and the device name matches
          console.log("/**********  REGISTRATION SUCCESSFUL FOR " + d + " at " + moment().format() + " ********/");
          //try to set cookie - if successful, redirect, else return error
          let ccrv = setRegistrationCookie( res, ro );
          if( !ccrv  ) rtn = executeTemplate( null, "Cookie could not be set.", "logged_out" );
          else return bro.get(true, null, null, redirect_path);
        }else{ //the code existed but they device name doesn't match
          rtn = executeTemplate(null, "The device you indicated ( " + d + " ) doesn't match the registration code used ( " + rc + " ). It should have been " + ro.device_name + ".", "logged_out");
        }
      }else{ //no posted data
        //display public registration homepage ( this view will be indexed by search engines )
        rtn = executeTemplate( null, "The necessary information was not sent with this request. Refer to your email!", "logged_out" );
      }
    }
  }else{ //this device is alreay registered
    let cc = JSON.parse( reg_cookie );
    rtn = executeTemplate( null, 'This device was registered on ' + cc.code + ' as ' + cc.device_name + '.' );
  }

  return bro.get( true, rtn );
}


/****** helpers *******/
//confirm if a device name is in the valid_devices list
function isValidDevice( device_name ){
  for( let i in valid_devices ){
    if( valid_devices[i] == device_name ){
      return true;
    }
  }
  return false;
}

//get the device name for a registration code
function getDeviceNameForCode( code ){
  for( let i in registration_codes ){
    if( registration_codes[i].code == code ){
      return registration_codes[i].device_name;
    }
  }
  return false;
}

//remove a registration code by the code
function removeRegistrationCode( code ){
  for( let i in registration_codes ){
    if( registration_codes[i].code == code ){
      return registration_codes.splice(i, 1)[0];
    }
  }
  return false;
}

//remove a registration code based on the device name
function removeRegistrationCodeFor( device_name ){
  for( let i in registration_codes ){
    if( registration_codes[i].device_name == device_name ){
      return registration_codes.splice(i, 1)[0];
    }
  }
  return false;
}

//generate a unique code
function generateCode( nugget ){
  let nugget_hash = crypto.createHash('md5').update(nugget).digest("hex");
  return moment().format('x') + "_" + nugget_hash;
}
