/****

The PURPOSE of this router is send interaction requests to the correct service

****/


const fs = require('fs');

//this variable tells the server what urls to route here
let brp = "request";
module.exports.base_route_path = brp;

//The server expects a basic return object or an error to be thrown
//load the basic return object prototype
var bro = require("../../server/bro");
//load any controllers needed to handle requests
var template_manager = require('../../views/template_manager');

//associate paths with services to load
var paths = {
  "login":{
    "service":"../services/user_service"
  }
}

//load services


async function routeRequest( request, response, file_parts ){
  let rtn = null;
  //if no page name, use default template
  if( !file_parts || file_parts.length == 0 ) return bro.redirect( "/" );
  //get requested page name
  let path = file_parts[0].toLowerCase();
  //check for requested template in templates object
  if( paths[ path ] ){
    let data_to_send = { domain:template, title:pages[template].title, description:pages[template].desc };
    //execute template
    rtn = bro.get( true, template_manager.executeTemplate( templates[ template ], data_to_send ) );
  }else{
    //otherwise, show unsupported route message for now
    rtn = bro.get(true, template_manager.executeTemplate( template_manager.unsupported_route, {message:"There isn't anything more to see here."} ) );
  }
  return rtn;
}

module.exports.router = routeRequest;
