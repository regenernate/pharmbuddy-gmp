//Purpose of this service is to manage access for known users and track where activity occurs - i.e. on what computer something is done

const fs = require("fs");

/**********    configuration *******/
var users = {};
var user_config_path = './services/user/data/config.json';

function loadUsers( path ){
  //for now load from local file
  fs.readFile(path, (error, content) => {
    if(error) {
      console.log(error);
      console.log("user_service could not load users list");
    }else{
      let c = JSON.parse(content);
      for( let u in c.users ){
        users[ c.users[u].name ] = c.users[u];
      }
    }
  });
}

const keygen = require('../../tools/keygen/keygen.js');

/********  bootstrap the data internally for now ********/
loadUsers( user_config_path );
//loadKeys( key_config_path );

/**********   user facing functionality *********/

module.exports.requestAccess = function(name){
  let rtn_key;
  try{
    console.log("User_service requestAccess :: " + name );
    rtn_key = keygen.generateKey( name );
  }catch(e){
    console.log("user_service error requesting access for " + name );
    console.log(e.message);
  }finally{
    return rtn_key;
  }
}

module.exports.registerDevice = function(key, descriptor){
  console.log("User_service registerDevice :: ", key, descriptor );
  let device_key;
  try{
    device_key = keygen.registerDevice( key, descriptor );
    if( !device_key ){
      console.log("user_service error confirming access");
      device_key = "";
    }
  }catch(e){
    console.log("user_service error confirming access for " + name + " on " + descriptor);
  }finally{
    console.log("finally");
    return device_key;
  }
}

module.exports.confirmAccess = function( name, device_code ){
  console.log("User_service confirmAccess :: ", name, device_code);
  let sess_key;
  try{
    sess_key = keygen.registerAccess();
    console.log("session key is :: " + sess_key);
    //store session here and return it
  }catch(e){
    console.log("user_service error confirming access for " + name + " on " + descriptor);
    console.log(e.message);
  }finally{
    return session;
  }
}
