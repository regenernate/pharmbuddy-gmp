require('dotenv').config();

//set up database connection(s)
const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( loadInjectors );

console.log(process.env);

const ingredients = require('./services/ingredients/ingredients.js');
const fse = require('./services/batches/fse_batches.js');
const runs = require('./services/production_runs/runs.js');

async function loadInjectors(){
  try{
    // insert ingredients
    console.log("INGREDIENTS");
    await clearOldData("ingredients");
    await ingredients.initialize();
    for( let i in inventory ){
      console.log( await ingredients.addLot(inventory[i].key, inventory[i]));
    }
    console.log( await ingredients.getCurrentList() );
    /*  finished with ingredients */

    // insert fse
    console.log("FSE BATCHES");
    await clearOldData("fse");
    await fse.initialize();
    for( let i=0; i<extracts.length; i++ ){
      console.log( await fse.addBatch(extracts[i]) );
    }
    console.log( await fse.getBatchList() );
    /* finished with FSE */

    // insert runs
    console.log('PRODUCTION RUNS');
    await clearOldData('production_runs');
    await runs.initialize();
    for( let i=0; i<production_runs.length; i++ ){
      console.log( await runs.createRun(production_runs[i]) );
    }
    console.log( await runs.getAllRuns() );
    /* finished with production runs */
    process.exit();
  }catch(err){
    console.log( "there was an error loading a configured router", err.stack );
  }
}


async function clearOldData(collection){
  let d1 = await mongo_connect.dropCollection( collection );
}

let extracts = [
  {
    production_date: '1573448400000',
    mechanism: 'rosin press',
    location: 'On Site',
    percent_cbd: '.619',
    initial_mass: 120,
    current_mass: 95,
    use_for: [ 'salve' ],
  },
  {
    production_date: '1574917200000',
    mechanism: 'rosin press',
    location: 'On Site',
    percent_cbd: '.637',
    initial_mass: 400,
    current_mass: 250,
    use_for: [ 'sublingual' ],
  },
  {
    production_date: '1578114000000',
    mechanism: 'subcritical',
    location: "Grower's Hemp",
    percent_cbd: '.527',
    initial_mass: 600,
    current_mass: 600,
    use_for: [ 'sublingual', 'salve' ],
  }
];

let inventory = [
  {
  key: 'argan_oil',
  lot_number: 'arganlotnum',
  current_volume: '500',
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
  key: 'lemon_eo',
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
  key: 'orange_eo',
  lot_number: 'firstorangeeolot',
  current_volume: '30',
  expiration_date: '1658376000000',
  initial_volume: '30',
  label: 'Orange Essential Oil',
  purchase_date: '157515640000',
  purchased_from: 'DoTerra'
},
{
  key: 'peppermint_eo',
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
      key: 'peppermint_eo',
      amount: 0.84375,
      units: 'ml',
      lot_number: 'firstpmlot',
      total_amount: 1.687,
      label: 'Peppermint Essential Oil'
    }
  ],
  fse: {
    batch_id: 2,
    amount: 13.099,
    units: 'g',
    total_amount: 26.198,
    lot_number: 2,
    label: 'FSE batch# 2'
  },
  units_made: '2',
  strength: '300',
  product_type: 'salve',
  batch_id: 104,
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
      key: 'peppermint_eo',
      amount: 0.84375,
      units: 'ml',
      lot_number: 'firstpmlot',
      total_amount: 1.687,
      label: 'Peppermint Essential Oil'
    }
  ],
  fse: {
    batch_id: 2,
    amount: 6.549,
    units: 'g',
    total_amount: 13.098,
    lot_number: 2,
    label: 'FSE batch# 2'
  },
  units_made: '2',
  strength: '150',
  product_type: 'salve',
  batch_id: 105,
}
];
