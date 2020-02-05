/*********

The purpose of this router is to accept and manage requests to register user devices.


*********/

module.exports.base_route_path = "register";

//main request handler
module.exports.router = async function( req, res, path ) {

  if(!path) path = [''];
  let rtn;

  let is_registered = getRegisteredDevice( req );

  if( is_registered == false ){ //this device is not yet registered
    if( path[0] == "get_registration_code" ){
      if( req.body ){ //must have post data
        if( isValidDevice( req.body.device_name ) ){
          let reg_code = generateRegistrationCode( req.body.device_name );
          rtn = renderData( {registration_code:reg_code, device_name:req.body.device_name});
        }else{
          rtn = renderError( req, "Invalid device name sent.", "none" );
        }
      }else rtn = renderError( req, "<h1>I don't recognize this path.</h1>" );
    }else if( path[0] !== "confirm" ){ //assume registration attempt
      let rc = path[0]; //registration code is the first segment of the path
      console.log("/**********  REGISTRATION ATTEMPT FOR " + rc + " AT " + moment().format() + " ********/");
      //cheat to see if this registration code is valid
      if( isValidCode( rc ) ){ //its a valid code
        //serve up page with the device choices
        rtn = renderTemplate( req, pages.confirm_device, {registration_code:rc, devices:valid_devices} );
      }else{
        //this is an invalid code
        rtn = renderError( req, "You did not send a valid registration code ( " + rc + ")." );
      }
    }else{ //this is a registration confirmation attempt
      //step 2 :: confirm device name matches registration code
      if( req.body ){ //must have post data
        let d = req.body.device_name;
        let rc = req.body.registration_code;
        //remove device code ( if it exists )
        let ro = removeRegistrationCode( rc );
        if( !ro ){ // this registration code didn't exist in the system
          rtn = renderError(req, "The registration code is not valid! ( " + rc + " ).");
        }else if( ro.device_name == d ){ //this registration code exists and the device name matches
          console.log("/**********  REGISTRATION SUCCESSFUL FOR " + d + " at " + moment().format() + " ********/");
          //try to set the registered device - if successful, redirect, else return error
          if( !setRegisteredDevice( res, d ) ) rtn = renderError( req, "Cookie could not be set." );
          else return bro.redirect(redirect_path);
        }else{ //the code existed but they device name doesn't match
          rtn = renderError( req, "The device you indicated ( " + d + " ) doesn't match the registration code used ( " + rc + " ). It should have been " + ro.device_name + ".");
        }
      }else{ //no posted data
        //display public registration homepage ( this view will be indexed by search engines )
        rtn = renderError( req, "The necessary information was not sent with this request. Refer to your email!", "logged_out" );
      }
    }
  }else{ //this device is alreay registered
    return bro.redirect( redirect_path );
  }
  return bro.get( true, rtn );
}

//external requirements
const fs = require('fs');
const bro = require('../server/bro');
const moment = require('moment');
const crypto = require('crypto');
const { getRegisteredDevice, setRegisteredDevice } = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const { renderData, renderError, renderTemplate } = require('../tools/rendering/render_util');

//misc constants
const redirect_path = "/login/";


const valid_devices = [
  "the Basement 27\" iMac",
  "your phone ( or tablet )",
  "Nate's iMac",
  "Nate's macbookPro",
  "the iMac in Dad's office"
];
const default_device = valid_devices[1];

/***** create a unique registration code  *****/
function generateRegistrationCode( device_name ){
  if( isValidDevice( device_name ) ){
    removeRegistrationCodeFor( device_name );
    let c = generateCode( device_name );
    registration_codes.push( { device_name:device_name, code:c } );
    return c;
  }
  return false;
}

/****** various helpers *******/
//confirm if a device name is in the valid_devices list
function isValidDevice( device_name ){
  for( let i in valid_devices ){
    if( valid_devices[i] == device_name ){
      return true;
    }
  }
  return false;
}

//see if code sent is valid
function isValidCode( code ){
  for( let i in registration_codes ){
    if( registration_codes[i].code == code ){
      return true;
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


function initialize(){
  //load views
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { confirm_device:1, registered:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;

  //for now create a registration code for each device
//  for( let i in valid_devices ){
//    console.log( "REGISTRATION CODE FOR " + valid_devices[2] + " IS " + generateRegistrationCode( valid_devices[2] ) );
//  }
}

var pages;
var registration_codes = [];
initialize();
