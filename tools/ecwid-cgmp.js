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

async function getProduct(item){
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
  return {name:p_name, type:p_type, strength:p_strength};
}

/* Example of clean order object
{
  order_id: 98,
  customer_id: 115705679,
  payment_status: 'PAID',
  fulfillment_status: 'SHIPPED',
  customer_name: 'Robert Augspurger',
  customer_email: 'robbie@wolfchoir.com',
  subtotal: 48,
  total: 48,
  tax: 0,
  shipping_state: 'OR',
  city: 'Portland ',
  order_date: '1613291100000',
  items: [
    {
      sku: '40005',
      quantity: 1,
      name: '1% CBD Topical Salve',
      selected_options: [Array]
    }
  ]
}
*/

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

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const ecwid_store_id = 17874207;
const ecwid_private_token = 'secret_Ka2rZb1EL3x1fWCj3NQMHD9qv9rbmzn6';
const moment = require('moment');

module.exports = { getOrders:getOrders, getOrder:getOrder };
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

/* example object from orders call to Ecwid API *************

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
