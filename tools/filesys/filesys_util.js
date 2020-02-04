const DEFAULT_EXTENSION = ".handlebars";
const fs = require('fs');

//this will have to eventually be refactored as asynchronous but should only be used at initialization of the application
/**** Example call with parameters
pages:{
  "login":1,
  "logout":0
},
replace: true or falsy

returns pages or new object = { "login":"contents", logout:0 }
****/

module.exports.loadFiles = function( pages, replace ){
  if( !pages || typeof(pages) !== "object" ) { console.log("filesys_util.error in loadFiles() :: pages variable was not an object"); return false; }
  let rtn = ( replace ) ? pages : {};
  for( let i in pages ){
    //only load files for requested paths, allows easy turn off of certain files being loaded
    if( pages[i] ) rtn[ i ] = fs.readFileSync( pages[i], 'utf-8' );
  }
  return rtn;
}

/**** Example call with parameters
pages:{
  "login":1,
  "logout":0
},
dir: "../views/mains/" or "../views/mains",
ext: ".handlebars" or "handlebars",
replace: true or falsy

returns pages or a new object { "login":"../views/mains/login.handlebars", logout:0}
****/

module.exports.generatePaths = function( pages, dir, ext, replace ){
  if( !pages || typeof(pages) !== "object" ) { console.log("filesys_util.error in generatePaths() :: pages variable was not an object"); return false; }

  if( !dir || typeof(dir) !== "string" ) dir = DEFAULT_DIRECTORY;
  else if( dir.substring( dir.length-1 ) != "/" ) dir = dir + "/";

  if( !ext || typeof(ext) !== "string" ) ext = DEFAULT_EXTENSION;
  else if( ext.indexOf('.') !== 0 ) ext = "." + ext;

  let rtn = ( replace ) ? pages : {};
  for( let i in pages ){
    //only create paths for requested items, allows easy turn off of certain files being loaded
    if( pages[i] ) rtn[ i ] = dir + i + ext;
  }
  return rtn;
}

module.exports.loadData = function( pages, replace ){
  if( !pages ){ console.log("filesys_util.error in loadData() :: path was not a string"); return false; }
  if( typeof(pages) == "string" ){
    let f = fs.readFileSync( pages, 'utf-8' );
    return JSON.parse(f);
  }else if( typeof(pages) == "object" ){
    let r = loadFiles( pages, replace );
    for( let i in r ){
      r[i] = JSON.parse(r[i]);
    }
    return r;
  }
}
