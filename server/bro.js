let ms = 0;
let ct = 1;

function genid(){
  let d = Date.now();
  if( d != ms ){
    ct = 0;
    ms = d;
  }
  ct++;
  return ms + ":" + ct;
}

function get( success, content, error, redirect ){
  return { id:genid() , success:success, content:content, error:error, redirect:redirect };
}

function redirect( path ){
  return { id:genid(), success:true, redirect:path };
}

module.exports.get = get;
module.exports.redirect = redirect;
