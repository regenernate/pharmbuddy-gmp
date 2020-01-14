/****

The PURPOSE of this router is to handle requests for a set of mostly static content.
It defines a set of templates which correlate to specific urls.
It is used here to load the general information pages for the RRHH website

****/


const fs = require('fs');

//this variable tells the server what urls to route here
let brp = "static";
module.exports.base_route_path = brp;
//this variable controls whether or not this router gets loaded
module.exports.active = true;

//The server expects a basic return object or an error to be thrown
//load the basic return object prototype
var bro = require("../../server/bro");
//load any controllers needed to handle requests
var template_manager = require('../../views/template_manager');

var pages;
var default_page;

fs.readFile("./services/statics/data/pages.json", function(error, content){
  if(error) {
    console.log("statics_router error loading pages.json");
  }else{
    let c = JSON.parse(content);
    pages = c.pages;
    default_page = c.default_page;
    //now compile loaded templates
    compileTemplates();
  }
});

//this variable will hold the pre-compiled template functions for whatever pages are loaded in pages.json
var templates = {};

//this method is called after pages.json loads
function compileTemplates(){
  //extract just template name/path pairs for template manager to compile from
  for( var i in pages ){
    templates[i] = pages[i].template;
  }
  template_manager.compileTemplates(templates, true);
}

//write a method to handle route requests and return a bro
async function routeRequest( request, response, file_parts ){
  let rtn = null;
  //if no page name, use default template
  if( !file_parts || file_parts.length == 0 ) file_parts = [ default_page ];
  //get requested page name
  let template = file_parts[0].toLowerCase();
  //check for requested template in templates object
  if( templates.hasOwnProperty( template )){
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
