require('dotenv').config();

const http_server = require('./server/server_v2.js');

//when no base path is sent, default_router will be used
const default_router_path = "static";

var port = process.env.PORT;
var ip = process.env.BIND_IP;

if( !port || !ip ){
  console.log("Don't forget to set your .env file and define a port and ip.");
}

//pull this out into /services/router_config.json
var routers_to_load = [ {name:"statics_router", path:"../services/statics/" }, {name:"request_router", path:"../services/request/" } ];

function loadRouters(){
  //loadConfiguredRoutes('./server/routers/', './routers/');
  for( let i in routers_to_load ){
    http_server.addRouter( routers_to_load[i].name, routers_to_load[i].path );
  }
  http_server.setDefaultRouter( default_router_path );
}

try{
  loadRouters();
  http_server.startServer(port, ip);
}catch(err){
  console.log( "there was an error loading a configured router", err.message );
}


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
