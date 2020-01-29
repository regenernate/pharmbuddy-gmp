/****

The purpose of this utility class is to provide a convenient method for cookies to be set and retrieved by routers or services

*****/

const set_cookie_header_name = "set-cookie";
const cookie_header_name = "cookie";
const default_path = "/";
const default_max_age = 60*60*24*365*5; //expires in 5 years ... just for now
const domain = process.env.COOKIE_DOMAIN;

module.exports.setCookie = function( res, name, content, max_age ){
  if( !name || !content ){ console.log("Cookie_util :: You didn't send name or content to setCookie."); return false; }
  if( max_age === true ) max_age = default_max_age; //default expires to true if nothing sent
  else if( isNaN( max_age ) ) max_age = false;
  let ncl = [ createCookieString( name, content, max_age ) ]; //push new cookie onto cookie array
  let c = res.getHeader( set_cookie_header_name );
  if( c ){ //there is a cookie header so add this one to it, or replace the same named cookie, if one exists
    let ocl = c.split(","); //old cookie list
    let cc;
    for( let i in ocl ){
      cc = ocl[i].split("=");
      if(cc[0].trim().toLowerCase() == name.toLowerCase() ) continue; //skip copying this one since it is being replaced
      else ncl.push( ocl[i] ); //copy this one to new cookie list
    }
  }
  res.setHeader( set_cookie_header_name, ncl );
  return true;
}

module.exports.getCookie = function( req, name ){
  if( !req || !req.headers || !name ) return false;

  let c = req.headers[ cookie_header_name ];
  if(c){
    let cl = c.split(";");
    let cc;
    for( let i in cl ){
      cc = cl[i].split( "=" );
      if( cc[0].trim().toLowerCase() == name.toLowerCase() ) return decodeContent( cc[1] );
    }
  }
  return false;
}

function createCookieString( name, content, max_age ){
  return name + "=" + encodeContent(content) + ";domain="+ domain + ";path=" + default_path + ";HttpOnly" + ( (max_age) ? ";max-age=" + max_age : "");
}

function encodeContent( content ){
  let ec = encodeURIComponent( content )
  return ec;
}

function decodeContent( content ){
  let dc = decodeURIComponent( content );
  return dc;
}
