
//content-types of interest
const FORM_URLENCODED = 'application/x-www-form-urlencoded';
const FORM_MULTIPART = 'multipart/form-data';
const mime_types = require('./mime_types').getMimeTypes();

const fs = require("fs");
const path = require('path');
const http = require('http');
const moment = require("moment");
const query = require('query-string');
const { parse } = require('querystring');
const { location } = require('./location');

//connect to various data sources, ideally extracted to one config per service

/*mysql database
var db = require('./database/mysql2_db.js');

db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to MySQL.');
    process.exit(1)
  } else {
    initHttpServer();
  }
}); */

//mongodb database...


//user service ...
//assumption :: the user service will handle access control so the server does no independent user verification
//assumption :: a valid user service implements the following methods
//  isValidUser( request, response ); - upon false return, server will respond with login form
//                                    - true returns pass control to requested route
//  getLoginForm(); - return value will be response
//  login();
//  logout();

var http_server;

function initHttpServer( port, ip ){
  http_server = http.createServer( receiveHttpRequest ).listen(port, ip);
}

module.exports.startServer = initHttpServer;

//load routers and configured routes
/**** assumptions ****
configured routers contains router objects tied to a base url path
they must implement base_route_path and router methods
router method must have signature router( request, response, file_parts )
  where file_parts is an array of the remaining requested url segments without the base_route_path included
  file_parts also will not have any querystring but will have request.query object if any query string was sent
*********************/

var default_router_path;
var configured_routers = { };

function loadConfiguredRouter( name, mod ){
  let {router,base_route_path} = require(mod+name);
  configured_routers[ base_route_path ] = router;
}

function setDefaultRouter( name ) {
  default_router_path = name;
}

module.exports.addRouter = loadConfiguredRouter;
module.exports.setDefaultRouter = setDefaultRouter;

async function receiveHttpRequest(request, response) {
  try{
//    console.log('SERVER REQUEST RECIEVED :: ', request.url, request.method);
    let request_path = request.url.toLowerCase();
    let request_method = request.method.toLowerCase();
    let request_headers = request.headers || {};

    let ext = String(path.extname(request_path)).toLowerCase();
    //if requested resource has a file extension, treat as static route
    if( ext !== "" ){

      attemptToServeStaticFile( request, response, request_path, request_headers, ext );

    } else { //pull querystring and posted data then attempt static response

      //get any querystring data and remove it from the request.url
      getQueryString( request, request_path );

      /* check for posted form or image data if post method requested */
      if( request_method == "post" ){

        getPostedData( request, response, request_headers );

      }else if( request_method == "get" ){
        //no need to wait for image or form data processing so go ahead and respond...
        respondToRequest( request, response );

      }else throw new Error("Unsupported request method :: " + request_method);
    }
  }catch(err){
    console.log(err.stack);
    endRequest( response, "SERVER ERROR CAUGHT :: " + err.message + " :: " + err.stack, 'text/plain', 500 )
  }
}

function getQueryString( request, path ){
  let qmi = path.split("?");
  if( qmi.length > 2 ) throw new Error('THERE can only be one ? in the query string.' + path);
  else if( qmi.length > 1 ){
    let queryobject = query.parse( qmi[1] );

    //extract this into a helper that can be loaded as needed
    if(queryobject.latitude && queryobject.longitude){
      request.geolocation = location( queryobject.latitude, queryobject.longitude, queryobject.accuracy );
      delete(queryobject.latitude);
      delete(queryobject.longitude);
      delete(queryobject.accuracy);
    }

    request.query = queryobject;
    if(qmi[0].substr(-1) == "/") qmi[0] = qmi[0].substring(0, qmi[0].length-1);
    request_path = qmi[0];
    request.url = request_path;
    console.log("server_v2:queryobject => ", queryobject, request.url);
  }else request.query = {};
}

function getPostedData( request, response, headers ){
  if( !headers.hasOwnProperty('content-type') ){
    throw new Error("POST method received with no content-type declaration.");
  }else{
    let content_type_in = headers['content-type'].toLowerCase();
    if( content_type_in.indexOf(FORM_URLENCODED) >= 0 ) {
      console.log( "  PROCESSING AS :: " + FORM_URLENCODED );
      collectRequestData( request, response, respondToRequest );
    }else if( request.headers['content-type'].indexOf(FORM_MULTIPART) >= 0 ){
      console.log( "  PROCESSING AS :: " + FORM_MULTIPART );
      throw new Error("Currently not accepting posted image data");
  //          image_service.processImageData( request, response, respondToRequest );
    }else{ //no special processing for other content types yet ...
      throw new Error("Unsupported content type requested for post method :: " + content_type_in);
    }
  }
}

async function respondToRequest( request, response ){
  //only dynamic requests make it here
  let content_type_out = mime_types['.html'];
  try{
    let request_path = request.url.toLowerCase();
    let request_method = request.method.toLowerCase();
    let request_headers = request.headers || {};

    if( request_path == '/') {
      request_path = default_router_path;
    }

    //for now check only for html then json accepts
    if( request_headers.hasOwnProperty( 'accept' ) ){
      let accepts_header = String(request_headers.accept).toLowerCase();
      if( accepts_header.indexOf( mime_types['.html'] ) >= 0 ) content_type_out = mime_types['.html'];
      else if( accepts_header.indexOf( mime_types['.json'] ) >= 0 ) content_type_out = mime_types['.json'];
      else throw new Error('Dynamic routes currently only serve content with accepts header html or json.');
    }else{
      content_type_out = mime_types['.html'];
    }
    //clean up requested url
    let file_parts = request_path.split("/");
    if( file_parts[0] == "" || file_parts[0] == "." ) file_parts.shift();
    if( file_parts[ file_parts.length-1] == "" ) file_parts.pop();
    //if no matched router domain, insert default domain into url
    if( !configured_routers.hasOwnProperty( file_parts[0] )){
      file_parts.unshift(default_router_path);
    }
    //call matched router
    console.log("routing to :: ", file_parts)
    let routed_call = await configured_routers[ file_parts[0] ]( request, response, file_parts.slice(1) );

    if(!routed_call.success){
      if( routed_call.error ) console.log( "/***** ERROR CALLING ROUTE *****/ ( " + routed_call.error + " )" );

      if( routed_call.redirect ){
        response.writeHead(302, { "Location": routed_call.redirect });
        response.end();
      }else if(content_type_out == mime_types['.html']){
        endRequest( response, routed_call.error, content_type_out );
      }else if(content_type_out == mime_types['.json']){
//                if( typeof(routed_call.error) == "string" ) routed_call.error = {error:routed_call.error};
        endRequest( response, JSON.stringify({success:false, error:routed_call.error}), content_type_out );
      }
    }else{
      if( routed_call.redirect ){
        response.writeHead(302, { "Location": routed_call.redirect });
        response.end();
      }else if(content_type_out == mime_types['.html']){
        endRequest( response, routed_call.content, content_type_out );
      }else if(content_type_out == mime_types['.json']){
        endRequest( response, JSON.stringify({success:true,content:routed_call.content}), content_type_out );
      }
    }
  }catch(err){
    console.log("RESPOND TO REQUEST CATCH", err.stack);
    if(content_type_out == mime_types['.html']){
      endRequest( response, err.message, content_type_out );
    }else if(content_type_out == mime_types['.json']){
      endRequest( response, JSON.stringify({success:false, error:err.message}), content_type_out );
    }else{
      endRequest( response, "Cannot process this request\r\r." + err.message, mime_types['.txt'] );
    }
  }
}

//method to get posted data and add it to the request object body
async function collectRequestData(request, response, resume) {
  //get any posted parameters
  let body = '';
  request.on('data', chunk => {
      body += chunk.toString();
  });
  request.on('end', async () => {
    //annoying hack necessary to create prototype functions on querystring parsed object
    request.body = JSON.parse(JSON.stringify(parse(body)));
    //look for and reformat dates
    for( let i in request.body ){
      if( i.indexOf( "_date" ) >= 0 ){
        request.body[i] = formatDateForDB( request.body[i] );
      }
    }
    console.log( request.body );
    //look for and reformat location objects - put this into the where service
    if( request.body.latitude && request.body.longitude ){
      request.geolocation = location(request.body.latitude, request.body.longitude, request.body.accuracy);
      delete( request.body.latitude );
      delete( request.body.longitude );
      delete( request.body.accuracy );
    }
    resume(request, response);
  });

}

function formatDateForDB( datestring, format_as ){
  if(!format_as) format_as = "x";
  return moment(datestring).format(format_as);
}

const STATICS_DIRECTORY = "dist";

async function attemptToServeStaticFile( request, response, path, headers, extension ){

  let content_type_out = mime_types[ extension ];

  if( !content_type_out ){
     response.writeHead(404, { "Content-Type":"text/html" });
     response.end("You requested an invalid content type.", "utf-8");
     return;
   }
  //check extension against content-type
  //check extension against supported list
  //check extension against accepts header
  if( headers.hasOwnProperty( 'accepts' ) ){
    if(String(headers.accepts).toLowerCase().indexOf(content_type_out) < 0){
      response.writeHead(404, {"Content-Type":"text/html"});
      response.end("Something is fishy with this media request.");
    }
  }
  //clean up path
  let file_parts = path.split("/");
  if( file_parts[0] == "" || file_parts[0] == "." ) file_parts.shift();
  if( file_parts[ file_parts.length-1] == "" ) file_parts.pop();
  //hijack path to only try loading static files from the dist directory
  file_parts.unshift( STATICS_DIRECTORY );
//  console.log( file_parts.join('/') );
  let nfp = "./" + file_parts.join("/");
  //try to serve static file
  fs.readFile( nfp, function(error, content) {
      if (error) {
        endRequest( response, "SERVER ERROR :: There is no resource at " + nfp + "!", 'text/plain', 404);
      }
      else {
        endRequest( response, content, content_type_out );
      }
  });
}

function endRequest( response, content, content_type, response_code ){
  if( !response_code ) response_code = 200;
  response.writeHead( response_code, { 'Content-Type': content_type });
  response.end(content, 'utf-8');
}
