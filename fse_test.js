require('dotenv').config();

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( loadTests );

var fse;
var key = "11112019_rosin_press";

async function loadTests(){
  try{
    fse = await require('./services/batches/fse_batches');
    await fse.initialize();
//    let a = await fse.getBatchForProduct( "sublingual" );
//    console.log(a);
//    let b = await fse.pullFromBatch( "11112019_rosin_press", 5 );
//    console.log(b);
//    console.log( await fse.getBatchLot("11112019_rosin_press") );
//    console.log( await fse.getBatchForProduct( "salve" ) );
//    let c = await fse.unretireBatch(key);
//    console.log(c);
//    console.log( await fse.getBatchForProduct( "salve" ) );
    console.log( await fse.getAvailableMass("11282019_rosin_press") );
  }catch(err){
    console.log( "there was an error loading a test", err.stack );
  }
}
