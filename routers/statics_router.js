
module.exports.base_route_path = "static";

const fs = require('fs');
const bro = require('../server/bro');
const template_manager = require('../views/template_manager');

var statics = { login:1 };
var pages = {};

let dir = "./views/mains/";

fs.readdir(dir, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        if( statics.hasOwnProperty( file.split(".")[0] ))
        // Do whatever you want to do with the file
        loadFile(file, dir)

    });
});

function loadFile( name, path ){
  pages[ name.split('.')[0] ] = fs.readFileSync( path + name, 'utf-8' );
}

module.exports.router = async function( req, res, path ) {
  if(!path) path = [];
  if( pages.hasOwnProperty( path[0] ) ){
    //serve page
    return bro.get( true, template_manager.executeTemplate( null, pages[ path[0] ] , 'logged_out') );
  }
  else
  {
    //serve 404
    return bro.get( true, template_manager.executeTemplate( null, "This route doesn't exist yet.", 'logged_out' ) );
  }
}
