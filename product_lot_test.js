require('dotenv').config();

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( loadTests );

var pbatches;

async function loadTests(){
  try{
    pbatches = await require('./services/lots/product_lots.js');
    await pbatches.initialize();

  }catch(err){
    console.log( "there was an error loading a test", err.stack );
  }
}
