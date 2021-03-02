async function getOrder( order_id ){
/*
    return new Promise(function( resolve, reject){
    let method = "GET";
    let url = 'https://app.ecwid.com/api/v3/'+ecwid_store_id+'/orders?orderNumber=' + order_id + '&token='+ecwid_private_token;
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onreadystatechange = function() {
//            console.log("getOrders :: readyStateChange to " + xhr.status);
      if (xhr.readyState == 4 && xhr.status == 200) {
        let order = JSON.parse(xhr.responseText);
        let rtn = cleanOrderObject( order.items[0] );
        resolve( rtn );
      }
    };
    xhr.onerror = function () {
        reject({
            status: this.status,
            statusText: xhr.statusText
        });
    };
    xhr.send();

  });
  */
}

async function doIt(orders){
  for( let i in orders.orders ){
    orders.orders[i] = cleanOrderObject( orders.orders[i] );
    for( let k in orders.orders[i].items ){
      console.log("k :: ", k);
      let success = await savePurchaseLineItem( orders.orders[i].items[k] );
      //if any fail to save, we need to abort
      if( !success ) throw new Error("Shopify-cgmp :: Couldn't save order item :: ", orders.orders[i].items[k]);
    }
  }
  return true;
}

async function getOrders( last_order_date ){
  let lod;
  if( last_order_date ){
    lod = moment(parseInt(last_order_date)+1000, 'x').format();
  }
  let url = base_api_url + "orders.json";
  url += "?fields=id,created_at,email,line_items,shipping_address" + ( ( lod ) ? "&created_at_min=" + lod : "" );
//  console.log(url);
  return new Promise(function (resolve, reject) {
    let http = new XMLHttpRequest();
    http.open('GET', url, false );
    http.setRequestHeader('X-Shopify-Access-Token', SHOPIFY_API_PASS);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = async function(){
      if( http.readyState == 4 ){
        if( http.status == 200 ){
          //console.log("yes!!!");
          let orders = JSON.parse(http.responseText);
          //persist the line items via the savePurchaseLineItem method as provided by calling component
          await doIt( orders );
          resolve(true);
        }else{
          resolve(false);
        }
      }
    }
    http.onerror = function(){
      reject(false);
    }
    http.send();
  });

/*  return new Promise(function (resolve, reject) {
          let method = "GET";
          let url = 'https://app.ecwid.com/api/v3/'+ecwid_store_id+'/orders?paymentStatus=PAID&shippingStatus=SHIPPED&token='+ecwid_private_token;
          let xhr = new XMLHttpRequest();
          xhr.open(method, url);
          xhr.onreadystatechange = function() {
//            console.log("getOrders :: readyStateChange to " + xhr.status);
            if (xhr.readyState == 4 && xhr.status == 200) {
              let orders = JSON.parse(xhr.responseText);
              let data = [];
              for( let i in orders.items ){
                let o = orders.items[i];
                data.push( cleanOrderObject( o ) );
              }
              data.sort(function(a,b){
                if( a.order_id < b.order_id ) return 1;
                else return -1;
              });
//              console.log("getOrders :: orders loaded");
              resolve(data);
            }
          };
          xhr.onerror = function () {
              reject({
                  status: this.status,
                  statusText: xhr.statusText
              });
          };
          xhr.send();
      }); */
}

async function getProduct(item){
  //extract item info from this purchase line item
//  console.log( "shopify-cgmp.getProduct :: ", item );
  let p_name = item.product_name.toLowerCase();

  /*

    Using the name of the product as stored in Ecwid to pull out the product type and p_strength
    in order to reduce the number of runs to be selected from when correlating products with purchases.

    I know this is brittle, but its the easiest solution for now.

    In the future we can create a simple lookup of sku's with type and strength ... thats probably a better option!

  */

  let p_type = ( p_name.indexOf( 'salve' ) >= 0 ) ? "salve" : "sublingual";
  let p_strength;
  if( p_type == "salve" ){
    let tps = parseInt(p_name.substring(0, p_name.indexOf('%') ));
    switch(tps){
      case .5:
        p_strength = 150;
        break;
      case 1:
        p_strength = 300;
        break;
      case 2:
        p_strenth = 600;
        break;
    }
  }else{
    p_strength = parseInt(p_name.substring(0, p_name.indexOf('m')));
  }
  return {name:p_name, type:p_type, strength:p_strength};
//  return {name:"300mg Salve", type:"Salve", strength:300};
}

/* Example of clean order object

*/

function cleanOrderObject( o ){
  let rtn = {};
  rtn.order_id = o.id;
  rtn.customer_name = o.shipping_address.name;
  rtn.customer_email = o.email;
  rtn.order_date = moment(o.created_at).format('x');
  rtn.items = [];
  for( let j in o.line_items ){
    for( let k=0; k<o.line_items[j].quantity; k++ ){
      rtn.items.push({ origin:"shopify", order_date:rtn.order_date, customer_name:o.shipping_address.name, email:o.email, order_id:o.id, product_sku:o.line_items[j].sku, position:k, product_name:o.line_items[j].title, selected_options:o.line_items[j].variant_title.split(" / ").join(",") });
    }
  }
  //console.log("cleanOrderObject", rtn);
  return rtn;
}


const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_PASS = process.env.SHOPIFY_API_PASS;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION;

var base_api_url = "https://ravenridge-family-farm.myshopify.com/admin/api/" + SHOPIFY_API_VERSION + "/";
var graphql_api_url = "https://ravenridge-family-farm.myshopify.com/admin/api/" + SHOPIFY_API_VERSION + "/graphql.json";
var last_stored_order_id = null;

const moment = require('moment');
var savePurchaseLineItem;

module.exports = { getOrders:getOrders, getOrder:getOrder, getProduct:getProduct, setSaveMethod:(c) => { savePurchaseLineItem = c; } };


//getOrders();

/* Example return object from shopify api call

*********************/
