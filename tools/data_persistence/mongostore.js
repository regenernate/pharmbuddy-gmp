
/*** example usage **

const mongo_connect = require('./tools/data_persistence/mongostore');
mongo_connect.connect( () =>{ callback_function( params ) }); //will connect to mongo and then call method requested

****/

const { MongoClient, ObjectId } = require('mongodb');
// Connection URL
//mongodb://farmbuddy-5528:LdFf4XiaXVKj3NTqBgt997yW0PKB7x@db-farmbuddy-5528.nodechef.com:5398/farmbuddy
const connection_url = process.env.MONGO_URL || 'mongodb://localhost:27017/pharmbuddy-gmp';
const db_name = process.env.MONGO_DB || 'pharmbuddy-gmp';

// Use connect method to connect to the Server
function closeClient(){
  console.log("closing the mongostore's client connection!");
  client.close();
}

var client, db;
const upsert_obj = {upsert:true};
var collections = {};

async function collection( c_n ){
  if( !collections.hasOwnProperty(c_n) )
    collections[ c_n ] = await db.collection(c_n);
  return collections[c_n];
}


/*
module.exports.collection = async function( collection_name ){
  //create connection to this database if it doesn't already exist
  let rtn;
  if( collection_name ) rtn = {
    upsert:function(f, u){return db.collection(collection_name).updateOne(f, u, upsert );},
    find:function(fnd){return db.collection(collection_name).find(fnd);},
    delete:function(fnd){return db.collection(collection_name).deleteMany(fnd);}
   };
  else rtn = { close:closeClient };
  // Create a new MongoClient

  */

module.exports.getObjectId = function( _id ){
  return new ObjectId(_id);
}

module.exports.connect = async function( cb ){
  if( !client ){
    client = new MongoClient(connection_url, { useUnifiedTopology: true });
    client.connect(function(err){
      db = client.db(db_name);
      if( cb ) cb();
    });
  }else if( cb ){
    cb();
  }
}

module.exports.dropCollection = async function( c_n ){
  let c = await db.collection( c_n );
  let cnt = await c.countDocuments({});
  console.log("mongostore.dropCollection :: dropping " + cnt + " items from " + c_n);
  if( cnt > 0 ){
    await c.drop();
    return true;
  } else {
    return false;
  }
};

module.exports.collection = collection;
