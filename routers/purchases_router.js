
module.exports.base_route_path = "purchases";

//path variable does not contain the base_route_path
module.exports.router = async function( req, res, path ) {
  //handle authorization first
  let auth_check = sessions.isUserAuthorized( req );
  if( auth_check !== true ) return auth_check;

  try{
    //this if/then situation may not last if this router requires more routes
    if( !path || !path.length || path[0] == "" || path[0] == "list" ){
      let shipped_orders = await getOrders();
      return bro.get( true, renderTemplate( req, pages.order_list, { orders:shipped_orders } ) );
    }else if( path[0] == "customer" ){
      return bro.get( true, renderError(req, 'Viewing all orders by customer has not been implement yet.'));
    }else if( path[0] == "correlate" ){
      let order_id = path[1];
      if( isNaN(order_id) ) return bro.get( true, renderData( {success:false,message:"You didn't include an order id in this request...try finding one <a href='/purchases/list'>in this list</a>."}));
      else{
//        console.log( req.body );
        req.body.order_id = order_id;
        //save this sucker to the db, upserting if it already exists
        try{
          if( !await saveCorrelation( req.body ) ) throw new Error("Correlation couldn't be saved.");
        }catch(e){
          return bro.get(true, renderData({success:false, message:e.message}));
        }
        return bro.get( true, renderData({success:true }) );
      }
    }else if( path[0] == "taxes" ){
      let d = await getLastMonthsTaxes();
      return bro.get( true, renderTemplate(req, pages.tax_by_state, {last_month:moment().month(moment().month()-1).format('MMMM'), taxes_by_state:d}) );
    }else{
      let order_id = path[0];
      if( isNaN(order_id) ) return bro.get( true, renderError( req, "You didn't include an order id in this request...try finding one <a href='/purchases/list'>in this list</a>."));
      else{
        let order = await getOrder( order_id );
        let runs = await getAllRuns();
        for( let i in order.items ){

          order.items[i].runs = getRunsOfProduct( order.items[i], runs );

          //now look for existing correlations on these purchases
          for( let j=0; j<order.items[i].quantity; j++ ){
//            console.log("order.items[i] ", order.items[i]);
            let fnd = await getCorrelation( order.order_id, order.items[i].sku, j );

//how can I store the saved run_id for each item in an accessible way for the view??? What information needs to show?
            if( fnd ){
              if( !order.items[i].run_ids ) order.items[i].run_ids = [];
              order.items[i].run_ids[j] = fnd.run_id;
            }
          }
        }
        return bro.get( true, renderTemplate( req, pages.order_view, {order:order, runs:runs} ) );
      }
    }
  }catch(error){
    console.log(error.stack);
    return bro.get( true, renderError( req, error.message ) );
  }
}

function getRunsOfProduct( item, all_runs ){
  let p_name = item.name.toLowerCase();

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
    p_strength = parseInt(p_name.substring(0, p_name.indexOf(' ')));
  }

  let rtn = [];
  for( let i in all_runs ){
    if( all_runs[i].product_type == p_type && all_runs[i].strength == p_strength ){
      rtn.push( all_runs[i] );
    }
  }
  return rtn;
}

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderData, renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun, getAllRuns, saveCorrelation, getCorrelation } = require('../services/production_runs/runs');
const { getFSELabel, getIngredientLabel, getProductBatchId } = require("../services/inventory_manager");
const counties = require("../tools/county_lookup/county_lookup.js");

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { order_list:1, order_view:1, tax_by_state:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;

}

var pages;
initialize();


const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const ecwid_store_id = 17874207;
const ecwid_private_token = 'secret_Ka2rZb1EL3x1fWCj3NQMHD9qv9rbmzn6';
const moment = require('moment');


async function getOrder( order_id ){
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
}

const state_tax_rate = .0525;

async function getLastMonthsTaxes(){
  return new Promise(function(resolve, reject) {
    let method = "GET";
    let last_month = moment().date(0).hour(0).minute(0).second(0);
    let last_month_end = last_month.format('X');
    last_month.month( last_month.month() - 1 );
    let last_month_start = last_month.format('X');
    let url = 'https://app.ecwid.com/api/v3/'+ecwid_store_id+'/orders?createdFrom=' + last_month_start + '&createdTo=' + last_month_end + '&paymentStatus=PAID&shippingStatus=SHIPPED&token='+ecwid_private_token;
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onreadystatechange = function() {
//            console.log("getLastMonthsTaxes :: readyStateChange to " + xhr.status);
      if (xhr.readyState == 4 && xhr.status == 200) {
        let orders = JSON.parse(xhr.responseText);
        let data = [];
        let tbs = {};
        let total_tax = 0;
        for( let i in orders.items ){
          let o = cleanOrderObject(orders.items[i]);
          if( !o.total ) continue;
          if( o.shipping_state == "NC" ) o.county = counties.getCountyByCity( o.city );
          if( !tbs.hasOwnProperty( o.shipping_state )) tbs[ o.shipping_state ] = { num_orders:0, tax:0, counties:((o.shipping_state=="NC")?{}:null) };
          tbs[ o.shipping_state ].num_orders++;
          tbs[ o.shipping_state ].tax += o.tax;
          //if NC, also break down by county
          if( o.shipping_state == "NC" ){
            let state_tax = (o.total) ? o.subtotal * state_tax_rate : 0;
            if( !tbs.NC.counties.hasOwnProperty( o.county ) ) tbs.NC.counties[ o.county ] = {num_orders:0, tax:0};
            tbs.NC.counties[ o.county ].num_orders++;
            tbs.NC.counties[ o.county ].county_tax = Math.round( (o.tax-state_tax)*100)/100;
            tbs.NC.counties[ o.county ].state_tax = state_tax;
          }
          data.push( o );
        }

        data.sort(function(a,b){
          if( a.order_id < b.order_id ) return 1;
          else return -1;
        });
//              console.log("getOrders :: orders loaded");
        resolve(tbs);
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
}

async function getOrders(){
  return new Promise(function (resolve, reject) {
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
      });
}

function cleanOrderObject( o ){
  let no = { order_id:o.orderNumber, customer_id:o.customerId };
  no.payment_status = o.paymentStatus;
  no.fulfillment_status = o.fulfillmentStatus;
  no.customer_name = o.shippingPerson.name;
  no.customer_email = o.email;
  no.subtotal = o.subtotal;
  no.total = o.total;
  no.tax = o.tax;
  no.shipping_state = o.shippingPerson.stateOrProvinceCode.toUpperCase();
  no.city = o.shippingPerson.city;
  no.order_date = moment(o.createDate.split(" +")[0]).format('x');
  no.items = [];
  for( let j=0; j<o.items.length; j++ ){
    let noi = {
      sku:o.items[j].sku,
      quantity:o.items[j].quantity,
      name:o.items[j].name,
      selected_options:[]
    };
    for( let k=0; k<o.items[j].selectedOptions.length; k++ ){
      noi.selected_options.push({name:o.items[j].selectedOptions[k].name, value:o.items[j].selectedOptions[k].value});
    }
    no.items.push(noi);
  }
  return no;
}
/*
const https = require('https')
const options = {
  hostname: 'app.ecwid.com',
  port: 443,
  path: '/api/v3/17874207/orders?paymentStatus=PAID&token=public_BAQjmTRWjwc75bCsx4YQkY3JCCyE1ZX5',
  method: 'GET',
  headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Cache-Control":"no-cache",
      "Accept-Encoding":"gzip"
    }
}

async function getOrders(){
  var req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
      process.stdout.write(d)
    })
  })

  req.on('error', error => {
    console.error(error)
  })

  req.end()
}
*/

/****** example object from orders call to Ecwid API *************

{
  vendorOrderNumber: '23',
  refundedAmount: 0,
  subtotal: 65,
  total: 69.71,
  giftCardRedemption: 0,
  totalBeforeGiftCardRedemption: 69.71,
  email: 'lmyoung@mindspring.com',
  externalTransactionId: '5246239423',
  paymentModule: 'NetworkMerchants',
  paymentMethod: 'Credit or debit card',
  tax: 4.71,
  customerTaxExempt: false,
  customerTaxId: '',
  customerTaxIdValid: false,
  reversedTaxApplied: false,
  ipAddress: '108.91.141.235',
  couponDiscount: 0,
  trackingNumber: '9405511298370963245328',
  paymentStatus: 'PAID',
  paymentMessage: 'Approved',
  fulfillmentStatus: 'SHIPPED',
  orderNumber: 23,
  refererUrl: 'https://www.ravenridgefamilyfarm.com/purchase/',
  orderComments: '',
  volumeDiscount: 0,
  customerId: 60865040,
  membershipBasedDiscount: 0,
  totalAndMembershipBasedDiscount: 0,
  customDiscount: [],
  discount: 0,
  usdTotal: 69.71,
  globalReferer: 'https://webmail.c.earthlink.net/wam/msg.jsp?msgid=75202&folder=INBOX&isSeen=false&x=-2003552381',
  createDate: '2020-03-17 16:17:46 +0000',
  updateDate: '2020-03-17 23:40:55 +0000',
  createTimestamp: 1584461866,
  updateTimestamp: 1584488455,
  items: [
    {
      id: 254594997,
      productId: 163972568,
      categoryId: 45567001,
      price: 65,
      productPrice: 65,
      sku: '000020',
      quantity: 1,
      shortDescription: 'The 900mg CBD sublingual oil is our highest strength sublingual product and consists of RavenRidge grown full spectrum ...',
      shortDescriptionTranslated: [Object],
      tax: 4.71,
      shipping: 0,
      quantityInStock: 0,
      name: '900 mg CBD Sublingual, 1oz bottle',
      nameTranslated: [Object],
      isShippingRequired: true,
      weight: 0.328,
      trackQuantity: false,
      fixedShippingRateOnly: false,
      imageUrl: 'https://dqzrr9k4bjpzk.cloudfront.net/images/17874207/1246177271.jpg',
      smallThumbnailUrl: 'https://dqzrr9k4bjpzk.cloudfront.net/images/17874207/1246177270.jpg',
      hdThumbnailUrl: 'https://dqzrr9k4bjpzk.cloudfront.net/images/17874207/1246177272.jpg',
      fixedShippingRate: 0,
      digital: false,
      productAvailable: true,
      couponApplied: false,
      selectedOptions: [Array],
      taxes: [Array],
      dimensions: [Object],
      discountsAllowed: true,
      taxable: true,
      isGiftCard: false
    }
  ],
  refunds: [],
  billingPerson: {
    name: 'Lynn Young',
    street: '1405 Geneva St',
    city: 'Raleigh',
    countryCode: 'US',
    countryName: 'United States',
    postalCode: '27606',
    stateOrProvinceCode: 'NC',
    stateOrProvinceName: 'North Carolina',
    phone: '9196161334'
  },
  shippingPerson: {
    name: 'Lynn Young',
    street: '1405 Geneva St',
    city: 'Raleigh',
    countryCode: 'US',
    countryName: 'United States',
    postalCode: '27606',
    stateOrProvinceCode: 'NC',
    stateOrProvinceName: 'North Carolina',
    phone: '9196161334'
  },
  shippingOption: {
    shippingCarrierName: 'USPS',
    shippingMethodName: 'Priority Mail',
    shippingRate: 0,
    isPickup: false
  },
  handlingFee: { value: 0 },
  predictedPackage: [],
  additionalInfo: { 'NetworkMerchants reason code': '1' },
  paymentParams: {},
  creditCardStatus: {
    avsMessage: 'Address (Street) and five digit ZIP match',
    cvvMessage: 'Match'
  },
  hidden: false,
  taxesOnShipping: [],
  acceptMarketing: true,
  disableAllCustomerNotifications: false,
  externalFulfillment: false
}

*********************/
