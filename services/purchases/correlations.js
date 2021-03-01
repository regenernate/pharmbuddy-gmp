module.exports.saveCorrelation = async function( purchased_item ){
  if( !purchased_item.hasOwnProperty( 'run_id' ) || purchased_item.run_id == '' ){
    purchased_item.run_id = null;
  }
  if( !purchased_item.hasOwnProperty( 'origin' ) ){
    purchased_item.origin = "ecwid";
  }
  for( let i in purchased_item ){
    if( correlation_fields.indexOf( i ) < 0 ) throw new Error("correlations.saveCorrelation found invalid field propery ( " + i + " ).");
  }
  let fnd = await purchased_items.findOne({order_id:parseInt(purchased_item.order_id), product_sku:purchased_item.product_sku, position:parseInt(purchased_item.position)});
  let rtn;
  if( fnd && fnd.run_id != purchased_item.run_id ){ //update this entry
    rtn = await purchased_items.updateOne({_id:fnd._id}, {$set:{run_id:purchased_item.run_id}});
  }else if( !fnd ){
    //only insert new items if they have all the fields required
    for( let i=0; i<correlation_fields.length; i++ ){
      if( !purchased_item.hasOwnProperty( correlation_fields[i] ) ) throw new Error("correlations.saveCorrelation parameter sent was missing required property ( " + correlation_fields[i] + " )");
    }
    rtn = await purchased_items.insertOne(purchased_item);
  }
  return rtn.modifiedCount > 0 || rtn.insertedCount > 0;
}

module.exports.saveLineItem = async function( purchased_item ){
  if( !purchased_item.hasOwnProperty( "run_id" ) ) purchased_item.run_id = null;
  return await module.exports.saveCorrelation( purchased_item );
}

module.exports.getCorrelation = async function( order_id, product_sku, position ){
  let fnd = await purchased_items.findOne({order_id:order_id, product_sku:product_sku, position:String(position)});
  return fnd;
}

module.exports.getOrder = async function( order_id ){
  let fnd = await purchased_items.find({order_id:parseInt(order_id)}); //.sort({product_sku:1, position:1});
//  console.log(await fnd.toArray());
  return fnd.toArray();
}

module.exports.getLastOrderDate = async function(origin){
  let loid = await purchased_items.find((origin) ? {origin:origin} : "").sort({"order_date":-1}); //{origin:origin}
  let rtn;
  if( await loid.hasNext() ){
    rtn = await loid.next();
    console.log("correlations.js - getLastOrderDate :: ", rtn);
  }else{
    console.log("correlations.js :: getLastOrderDate - no dated orders found");
  }

  return rtn.order_date;
}

module.exports.getUncorrelatedOrders = async function( origin ){
  let pts = ( origin ) ? { origin:origin } : {};
  pts.run_id = null; //uncorrelated line items only, please
  let uco = await purchased_items.find(pts).sort({order_id:1, _id:1});
  //let uco = await purchased_items.aggregate([{ "$group": {"_id": "$order_id", items:{ $push: "$$ROOT" } } } ]);
  let ucoa = await uco.toArray();
  let rtn = [];
  let order_id = null;
  let co;
  //combine all items for same order
  console.log(ucoa);
  for( let i=0; i<ucoa.length; i++ ){
    if( ucoa[i].order_id != order_id ){
      rtn.push({order_id:ucoa[i].order_id, email:ucoa[i].email, customer_name:ucoa[i].customer_name, order_date:ucoa[i].order_date});
      co = rtn[rtn.length-1];
      co.items = [ ucoa[i] ];
      co.items[0].quantity = 1;
      order_id = ucoa[i].order_id;
      continue;
    }
    if( ucoa[i].product_sku == co.items[co.items.length-1].product_sku ){
      co.items[co.items.length-1].quantity++;
    }else{
      co.items.push(ucoa[i]);
      ucoa[i].quantity = 1;
    }
  }
  console.log(rtn);
  return rtn;
}

module.exports.initialize = async function(){
  if( !purchased_items ) purchased_items = await ds.collection('purchased_items');
  return true;
}

const moment = require('moment');
const correlation_fields = ["origin", "order_id", "order_date", "run_id", "product_sku", "product_name", "position", "customer_name", "email", "selected_options"];
const ds = require("../../tools/data_persistence/mongostore");

var purchased_items;
