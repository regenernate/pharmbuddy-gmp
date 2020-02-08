/* simple helper to manage uglifying css automatically whenever css files change in the supplied directory
limitations:

1. this helper must be running
2. list of css files to watch must be provided in order desired

*/


const fs = require("fs");
const uglifycss = require( 'uglifycss' );

/*  ultimately pull this out of file into data.json  */
var basepath = "../views/css/";
var outpath = "../dist/";
var uglified_filename = "css_uglified.css";
var uglified_print_filename = "printcss_uglified.css";
var css_files = [ "reset", "colors", "main", "fonts-and-margins", "images", "forms", "tables" ];
var print_files = [ "reset", "colors", "print_label" ];

for ( let i in css_files ){
  css_files[i] = basepath + css_files[i] + ".css";
}

for( let i in print_files ){
  print_files[i] = basepath + print_files[i] + ".css";
}

function uglify( files, output_filename ){
  var uglified_css = uglifycss.processFiles( files, {maxLineLen: 500} );
  fs.writeFile( outpath + output_filename, uglified_css, 'utf8', ()=>{ console.log("css uglified"); } );
}

//set up listeners for css file changes
fs.watch(basepath, (event, filename) => {
  if (filename) {
    if( filename != uglified_filename ){
      if( filename != "print_label.css" ) uglify( css_files, uglified_filename );
      if( filename == "reset.css" || filename == "print_label.css" || filename == "colors.css" ) uglify( print_files, uglified_print_filename );
    }
  }
});

//do initial uglification
uglify( css_files, uglified_filename );
uglify( print_files, uglified_print_filename );
