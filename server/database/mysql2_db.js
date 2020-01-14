var mysql = require('mysql2');
var async = require('async');

var state = {
  pool: null,
  mode: null,
}

exports.connect = function(done) {
    if(process.env.NODE_ENV && process.env.NODE_ENV=='development'){
      state.pool = mysql.createPool(
        {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit:10
      }).promise();
    }
    else {
      state.pool = mysql.createPool(process.env.DATABASE_URI).promise();
    }
    done();
}

exports.get = function() {
  return state.pool;
}
