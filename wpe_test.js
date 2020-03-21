require('dotenv').config();

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( loadTests );

var wpe;
var key = "11112019_rosin_press";

async function loadTests(){
  try{
    wpe = await require('./services/batches/wpe_batches');
    await wpe.initialize();
//    let a = await wpe.getBatchForProduct( "sublingual" );
//    console.log(a);
//    let b = await wpe.pullFromBatch( "11112019_rosin_press", 5 );
//    console.log(b);
//    console.log( await wpe.getBatchLot("11112019_rosin_press") );
//    console.log( await wpe.getBatchForProduct( "salve" ) );
//    let c = await wpe.unretireBatch(key);
//    console.log(c);
//    console.log( await wpe.getBatchForProduct( "salve" ) );
    console.log( await wpe.getAvailableMass("11282019_rosin_press") );
  }catch(err){
    console.log( "there was an error loading a test", err.stack );
  }
}
