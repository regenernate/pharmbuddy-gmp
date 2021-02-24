require('dotenv').config();

var do_in=false, do_ex=false, do_pr=false;

if( process.argv.length <= 2 ){
  console.log( "Ooops - you forgot to tell me what we are injectoring...");
  console.log( "Options are any combination of 'ingredients', 'extracts' and/or 'products'");
  process.exit();
}else{
  for( let i=2; i<process.argv.length; i++ ){
    switch( process.argv[i] ){
      case "ingredients":
        do_in = true;
      break;
      case "extracts":
        do_ex = true;
      break;
      case "products":
        do_pr = true;
      break;
      default:
        console.log( "Sorry, I'm not sure what " + process.argv[i] + " is, exactly." );
        process.exit();
      break;
    }
  }
}

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( () =>{ loadInjectors( do_in, do_ex, do_pr ) });

const ingredients = require('./services/ingredients/ingredients.js');
const fse = require('./services/lots/fse_batches.js');
const runs = require('./services/production_runs/runs.js');

async function loadInjectors(do_ingredients=false, do_fse=false, do_products=false){
  try{
    // insert ingredients
    if( do_ingredients ){
      console.log("INGREDIENTS");
      await clearOldData("ingredients");

      await ingredients.initialize();
      for( let i in inventory ){
        await ingredients.addLot(inventory[i].key, inventory[i]);
      }
      console.log( await ingredients.getCurrentList() );
      /*  finished with ingredients */
    }
    if( do_fse ){
      // insert fse
      console.log("FSE BATCHES");
      await clearOldData("fse");
      await fse.initialize();
      for( let i=0; i<extracts.length; i++ ){
        await fse.addBatch(extracts[i]);
      }
      console.log( await fse.getBatchList() );
      /* finished with FSE */
    }
    if( do_products ){
      // insert runs
      console.log('PRODUCTION RUNS');
      await clearOldData('production_runs');
      await runs.initialize();
      for( let i=0; i<production_runs.length; i++ ){
        await runs.createRun(production_runs[i]);
      }
      console.log( await runs.getAllRuns() );
      /* finished with production runs */
    }
  }catch(err){
    console.log( "there was an error loading a configured router", err.stack );
  }finally{
    process.exit();
  }
}


async function clearOldData(collection){
  let d1 = await mongo_connect.dropCollection( collection );
}

let extracts = [
  {
    production_date: '1546318800000',
    mechanism: 'rosin press',
    location: "On Site",
    percent_cbd: '.620',
    initial_mass: 20,
    current_mass: 0,
    use_for: [ 'sublingual', 'salve' ],
    retired_date: 1583038800000
  },
  {
    production_date: '1583038800000',
    mechanism: 'subcritical',
    location: "Grower's Hemp",
    percent_cbd: '.52',
    initial_mass: 500,
    current_mass: 447.2,
    use_for: [ 'sublingual' ],
  },
  {
    production_date: '1575176400000',
    mechanism: 'rosin press',
    location: 'On Site',
    percent_cbd: '.50',
    initial_mass: 725,
    current_mass: 634.3,
    use_for: [ 'salve' ],
  },
  {
    production_date: '1609477200000',
    mechanism: 'subcritical',
    location: "Grower's Hemp",
    percent_cbd: '.58',
    initial_mass: 2500,
    current_mass: 2500,
    use_for: [ 'sublingual', 'salve' ],
  }
];

let inventory = [
  {
  key: 'argan_oil',
  lot_number: 'arganlotnum',
  current_volume: '250',
  expiration_date: '1658376000000',
  initial_volume: '946',
  label: 'Argan Oil',
  purchase_date: '157515640000',
  purchased_from: 'Organic Verdana',
  do_not_use_for: []
},
{
  key: 'beeswax',
  lot_number: 'beeswaxnumber',
  current_volume: 2200,
  expiration_date: '1658376000000',
  initial_volume: '2500',
  label: 'Beeswax',
  purchase_date: '157515640000',
  purchased_from: 'Da Bees'
},
{
  key: 'hempseed_oil',
  lot_number: '140519012',
  current_volume: 0,
  expiration_date: '1581656400000',
  initial_volume: '3048',
  label: 'Hempseed Oil',
  purchase_date: '1575176400000',
  purchased_from: 'Nutiva',
  do_not_use_for: [],
},
{
  purchase_date: '1579176400000',
  purchased_from: 'Nutiva',
  lot_number: '140519044',
  expiration_date: '1581956400000',
  initial_volume: '2500',
  current_volume: 0,
  key: 'hempseed_oil',
  label: 'Hempseed Oil',
  do_not_use_for: [],
},
{
  key: 'lemon_essential_oil',
  lot_number: 'lemoneolotnumber',
  current_volume: '30',
  expiration_date: '1658376000000',
  initial_volume: '30',
  label: 'Lemon Essential Oil',
  purchase_date: '157515640000',
  purchased_from: 'DoTerra'
},
{
  key: 'licorice_flavoring',
  lot_number: 'A76498041819',
  current_volume: 91,
  expiration_date: '1650254400000',
  initial_volume: '118',
  label: 'Licorice Flavoring',
  purchase_date: '157515640000',
  purchased_from: 'Apex Flavorings'
},
{
  key: 'olive_oil',
  lot_number: 'none-15751764',
  current_volume: 9400,
  expiration_date: '1592539200000',
  initial_volume: '10647',
  label: 'Olive Oil',
  purchase_date: '1575176400000',
  purchased_from: 'Amazon Fresh'
},
{
  key: 'orange_cream_flavoring',
  lot_number: 'A77829073119',
  current_volume: 91,
  expiration_date: '1658376000000',
  initial_volume: '118',
  label: 'Orange Cream Flavoring',
  purchase_date: '157515640000',
  purchased_from: 'Apex Flavorings'
},
{
  key: 'lemon_essential_oil',
  lot_number: 'firstlemonlot',
  current_volume: '30',
  expiration_date: '1658376000000',
  initial_volume: '30',
  label: 'Lemon Essential Oil',
  purchase_date: '157515640000',
  purchased_from: 'DoTerra'
},
{
  key: 'orange_essential_oil',
  lot_number: 'firstorangeeolot',
  current_volume: '30',
  expiration_date: '1658376000000',
  initial_volume: '30',
  label: 'Orange Essential Oil',
  purchase_date: '157515640000',
  purchased_from: 'DoTerra'
},
{
  key: 'peppermint_essential_oil',
  lot_number: 'firstpmlot',
  current_volume: 24.096,
  expiration_date: '1658376000000',
  initial_volume: '30',
  label: 'Peppermint Essential Oil',
  purchase_date: '157515640000',
  purchased_from: 'DoTerra',
  do_not_use_for: []
},
{
  key: 'peppermint_flavoring',
  lot_number: 'SC1572030419',
  current_volume: 194,
  expiration_date: '1646370000000',
  initial_volume: '236',
  label: 'Peppermint Flavoring',
  purchase_date: '157515640000',
  purchased_from: 'Apex Flavorings'
},
{
  key: 'sunflower_seed_oil',
  lot_number: 'A77829073119',
  current_volume: 3040,
  expiration_date: '1658376000000',
  initial_volume: '3784',
  label: 'Sunflower Seed Oil',
  purchase_date: '157515640000',
  purchased_from: 'Reedy Fork'
}
];

const production_runs = [
  {
  ingredients: [
    {
      key: 'hempseed_oil',
      amount: 8,
      units: 'oz',
      lot_number: '140519012',
      total_amount: 16,
      label: 'Hempseed Oil'
    },
    {
      key: 'argan_oil',
      amount: 8,
      units: 'oz',
      lot_number: 'arganlotnum',
      total_amount: 16,
      label: 'Argan Oil'
    },
    {
      key: 'sunflower_seed_oil',
      amount: 8,
      units: 'oz',
      lot_number: 'A77829073119',
      total_amount: 16,
      label: 'Sunflower Seed Oil'
    },
    {
      key: 'beeswax',
      amount: 3,
      units: 'oz',
      lot_number: 'beeswaxnumber',
      total_amount: 6,
      label: 'Beeswax'
    },
    {
      key: 'peppermint_essential_oil',
      amount: 0.84375,
      units: 'ml',
      lot_number: 'firstpmlot',
      total_amount: 1.687,
      label: 'Peppermint Essential Oil'
    }
  ],
  fse: {
    batch_id: 3,
    amount: 13.099,
    units: 'g',
    total_amount: 26.198,
    lot_number: 2,
    label: 'FSE batch# 2'
  },
  units_made: '2',
  strength: '300',
  product_type: 'salve',
  lot_id: 102,
},
{
  ingredients: [
    {
      key: 'hempseed_oil',
      amount: 8,
      units: 'oz',
      lot_number: '140519012',
      total_amount: 16,
      label: 'Hempseed Oil'
    },
    {
      key: 'argan_oil',
      amount: 8,
      units: 'oz',
      lot_number: 'arganlotnum',
      total_amount: 16,
      label: 'Argan Oil'
    },
    {
      key: 'sunflower_seed_oil',
      amount: 8,
      units: 'oz',
      lot_number: 'A77829073119',
      total_amount: 16,
      label: 'Sunflower Seed Oil'
    },
    {
      key: 'beeswax',
      amount: 3,
      units: 'oz',
      lot_number: 'beeswaxnumber',
      total_amount: 6,
      label: 'Beeswax'
    },
    {
      key: 'peppermint_essential_oil',
      amount: 0.84375,
      units: 'ml',
      lot_number: 'firstpmlot',
      total_amount: 1.687,
      label: 'Peppermint Essential Oil'
    }
  ],
  fse: {
    batch_id: 3,
    amount: 6.549,
    units: 'g',
    total_amount: 13.098,
    lot_number: 2,
    label: 'FSE batch# 2'
  },
  units_made: '2',
  strength: '150',
  product_type: 'salve',
  lot_id: 101,
},
{
  ingredients: [
  {
    key: 'hempseed_oil',
    amount: 8,
    units: 'oz',
    lot_number: '140519012',
    total_amount: 8,
    label: 'Hempseed Oil'
  },
  {
    key: 'argan_oil',
    amount: 8,
    units: 'oz',
    lot_number: 'arganlotnum',
    total_amount: 8,
    label: 'Argan Oil'
  },
  {
    key: 'sunflower_seed_oil',
    amount: 8,
    units: 'oz',
    lot_number: 'A77829073119',
    total_amount: 8,
    label: 'Sunflower Seed Oil'
  },
  {
    key: 'beeswax',
    amount: 3,
    units: 'oz',
    lot_number: 'beeswaxnumber',
    total_amount: 3,
    label: 'Beeswax'
  },
  {
    key: 'peppermint_essential_oil',
    amount: 0.84375,
    units: 'ml',
    lot_number: 'firstpmlot',
    total_amount: 0.84375,
    label: 'Peppermint Essential Oil'
  }
],
fse: {
  batch_id: 3,
  amount: 13.099,
  units: 'g',
  total_amount: 13.099,
  lot_number: 2,
  label: 'FSE batch# 2'
},
units_made: '1',
strength: '300',
product_type: 'salve',
lot_id: 102,
}
];
