
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
      return bro.get( true, renderTemplate( req, pages.order_list, { orders:{shipped:shipped_orders}} ) );
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
    }else{
      let order_id = path[0];
      if( isNaN(order_id) ) return bro.get( true, renderError( req, "You didn't include an order id in this request...try finding one <a href='/purchases/list'>in this list</a>."));
      else{
        let runs = await getAllRuns();
        let order = await getOrder( order_id );
        for( let i in order.items ){
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

const bro = require("../server/bro");
const sessions = require("../tools/sessions/session_util");
const { renderData, renderError, renderTemplate } = require("../tools/rendering/render_util");
const { compileTemplates } = require('../views/template_manager');
const { getRun, getAllRuns, saveCorrelation, getCorrelation } = require('../services/production_runs/runs');
const { getWPELabel, getIngredientLabel, getProductBatchId } = require("../services/inventory_manager");

function initialize(){
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { order_list:1, order_view:1 }, "./views/mains/", ".handlebars", true ), true );
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
              let data = {};
              for( let i in orders.items ){
                let o = orders.items[i];
                if( !data.hasOwnProperty( o.customerId ) ) data[ o.customerId ] = [];
                data[ o.customerId ].push( cleanOrderObject( o ) );
              }
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