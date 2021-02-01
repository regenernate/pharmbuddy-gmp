const fs = require('fs');
const handlebars = require('handlebars');
const moment = require('moment');

//compile each of the templates sent
/** expects an object of full template paths to load **/
function compileTemplates( templates, replace ){
  var ret = ( replace ? templates : {} );
  //todo :: probably should change this call to be asynchronous
  for( var i in templates ){
    ret[i] = handlebars.compile( fs.readFileSync( templates[i], 'utf-8' ) );
  }
  return ret;
}

/*** extract into configuration along with layout templates to load and compile ***/
//compile and register partials
handlebars.registerPartial('head', handlebars.compile( fs.readFileSync( "./views/partials/head.handlebars", 'utf-8' )));
handlebars.registerPartial('header', handlebars.compile( fs.readFileSync( "./views/partials/header.handlebars", 'utf-8' )));
handlebars.registerPartial('footer', handlebars.compile( fs.readFileSync( "./views/partials/footer.handlebars", 'utf-8' )));
handlebars.registerPartial('add_ingredient_lot', handlebars.compile( fs.readFileSync( "./views/forms/add_ingredient_lot.handlebars", 'utf-8' )));

//these helpers ultimately need to be pulled out of this file

handlebars.registerHelper('asPercent', function( value ){
  let iv = parseFloat( value );
  if( !iv ) return value;
  let precision = 100;
  if( iv < 1 ) iv *= 100;
  return Math.floor( iv * precision ) / precision;
});

handlebars.registerHelper('for', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});

handlebars.registerHelper('runOptions', function( runs, used_ids, pos, block ){
  if( !runs.length ) return "";
  if(!used_ids) used_ids = [];
  let uid = used_ids[pos];
  let rtn = "";
  for( let i=0; i<runs.length; i++ ){
    rtn+="<option value='" + runs[i].run_id + "'";
    if( uid != null && uid == runs[i].run_id ) rtn += " selected";
    rtn += ">" + runs[i].run_id + " : " + runs[i].strength + "mg " + runs[i].product_type + " from " + runs[i].run_date_vf + "</option >";
  }
  return rtn;
} );

//load and compile layout templates
const default_layout = "logged_out";
const empty_template = function(data){ return data; };

const layouts = compileTemplates( {"logged_out":"./views/layouts/logged_out.handlebars", "none":"./views/layouts/none.handlebars"} );

module.exports.compileTemplates = compileTemplates;

/********

data should be an object with specific variables to be sent to the source template ... the main of the page being rendered
layout is the text key for a known layout

*******/
module.exports.executeTemplate = function( source, data, layout ){
  if( !layout ) layout = default_layout;
  else if( !layouts.hasOwnProperty( layout ) ){
    console.log("TemplateManager :: There is no layout ", layout);
    layout = "none";
  }

  if( !source ) source = empty_template;

  var template_value;
  try{
    cleanDatesForDisplay(data);
    template_value = layouts[ layout ]( { body:source(data.main), meta:{title:data.title, description:data.description }, footer:data.session, header:data.session });
  }catch(err){
    console.log("template_manager.executeTemplate :: ", err.message);
  }
  return template_value;
}

/***** Date formatters *****/
function cleanDatesForDisplay( d ){
  for( var i in d ){
    if( typeof d[i] === 'object' && !Array.isArray(d[i]) ){
      cleanDatesForDisplay( d[i] ); //call again with new object
    }else if( Array.isArray(d[i]) ){ //for actual arrays, check if any items are objects
      let a = d[i];
      for( var j in a ){ //look for objects in this array
        if( !Array.isArray(a[j]) && typeof a[j] === 'object'){
          cleanDatesForDisplay( a[j] );
        }
      }
    }else{
      if( i.indexOf('date') > -1 ){
        d[i + "_vf"] = formatDateForDisplay( i, d[i] );
        d[i + "_dpf"] = formatDateForDisplay( i, d[i], 'YYYY-MM-DD');
      }
    }
  }
//  return source( data );
}

function formatDateForDisplay( date_name, ms, format ){
  if( !format ) format='MM-DD-YYYY';
  //let r_date = moment( ms, 'x' ).format('MM-DD-YYYY [at] HH:MM');
  //console.log("formatDatesForDisplay converted " + date_name + " from " + ms + " to " + r_date);
  //return r_date;
  return moment( ms, 'x' ).format(format);
}
