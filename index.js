require('dotenv').config();

const http_server = require('./server/server_v2.js');

const port = process.env.PORT;
const ip = process.env.BIND_IP;

if( !port || !ip ){
  console.log("Don't forget to set your .env file and define a port and ip.");
  process.exit();
}

//pull this out into /services/router_config.json
var routers_to_load = [ {name:"registration_router", path:"../routers/" },
                        {name:"statics_router", path:"../routers/" },
                        {name:"production_router", path:"../routers/" },
                        {name:"scrum_router", path:"../routers/"}
                      ];

function loadRouters(){
  //loadConfiguredRoutes('./server/routers/', './routers/');
  for( let i in routers_to_load ){
    http_server.addRouter( routers_to_load[i].name, routers_to_load[i].path );
  }
  http_server.setDefaultRouter( "static" );
}

try{
  loadRouters();
  http_server.startServer(port, ip);
}catch(err){
  console.log( "there was an error loading a configured router", err.stack );
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
