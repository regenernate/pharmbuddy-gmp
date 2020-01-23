/****

The PURPOSE of this router is send interaction request to the correct service

****/


const fs = require('fs');

//this variable tells the server what urls to route here
let brp = "request";
module.exports.base_route_path = brp;

const template_manager = require('../../views/template_manager');

//this variable will hold the pre-compiled template functions for whatever pages are loaded in pages.json
var templates = {
  access:"./services/request/views/confirm_keycode.handlebars"
};
compileTemplates();

//this method is called after pages.json loads
function compileTemplates(){
  //extract just template name/path pairs for template manager to compile from
  template_manager.compileTemplates(templates, true);
}

//The server expects a basic return object or an error to be thrown
//load the basic return object prototype
var bro = require("../../server/bro");

//associate paths with services to load
var service_paths = {
  "user":{
    "service_path":"../../services/user/user_service"
  }
}

var services = {};
//load services
for( let p in service_paths ){
  services[p] = require(service_paths[p].service_path);
}

async function routeRequest( request, response, file_parts ){
  console.log("routeRequested in request router :: " + file_parts);
  let rtn = null;
  //if no page name, use default template
  if( !file_parts || file_parts.length == 0 ) return bro.redirect( "/" );
  //get requested page name
  let path = file_parts[0].toLowerCase();
  //check for requested template in templates object
  let key;
  switch( path ) {
    case "access":
      key = services.user.requestAccess( request.body.responsible_party );
      rtn = bro.get( (key != null ) ? true : false, template_manager.executeTemplate( templates[ path ], { name:request.body.responsible_party, key:key }) );
      break;
    case "keygen":
      key = services.user.registerDevice( request.query.key, request.query.local_descriptor);
      if( key ) rtn = bro.get( true, JSON.stringify({device_key:key}) );
      else rtn = bro.get( false, null, "The key sent doesn't match a pending access request. Go back to the website login page, and start over! ( You can yell at Nathan if you think you did it right. )" );
      break;
    case "confirm":
      key = services.user.confirmAccess( request.body.responsible_party, request.body.device_code );
      break;
    default:
      rtn = bro.get( false, JSON.stringify({error:"This route is not supported."}), "none");
  }
  return rtn;
}

module.exports.router = routeRequest;
