require('dotenv').config();

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( loadTests );

var ingredients;

async function loadTests(){
  try{
    ingredients = await require('./services/ingredients/ingredients.js');
    await ingredients.initialize();
//    let al = await ingredients.addLot( 'hempseed_oil', sample_lot );
//    let dl = await ingredients.deleteLot( 'hemptity_seed', "140519044");
//    console.log(dl);
//    let um = await ingredients.updateMass( 'hempseed_oil', '140519044', 52 );
//    let uv = await ingredients.updateVolume( 'hempseed_oil', '140519012', 120 );
//    let i = await ingredients.getItem('hempseed_oil', '140519012');
//    console.log(i);
//    let pvfl = await ingredients.pullMassFromLot( 'hempseed_oil', '140519044', 10 );
//    let rt = await ingredients.unretireIngredient( 'hempseed_oil', '140519012', 'salve');
//    let re = await ingredients.unretireIngredient( 'hempseed_oil', '140519044' );
//      let re = await ingredients.retireIngredient( 'hempseed_oil', '600200542', 'sublingual' );
//      console.log(re);
//    let gcl = await ingredients.getCurrentLot('hempseed_oil', 'salve');
//    console.log(gcl);
    console.log( await ingredients.getCurrentList() );
  }catch(err){
    console.log( "there was an error loading a test", err.stack );
  }
}



let sample_lot = {
  purchase_date:"1579176400000",
  purchased_from:"Nutiva",
  lot_number:"600200542",
  expiration_date:"1584956400000",
  initial_volume:"2500",
  current_volume:"2500",
  label:"hempseed oil"
}
