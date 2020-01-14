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
  let id = genid();
//  console.log("new bro with id : " + id);
  return { id:id , success:success, content:content, error:error, redirect:redirect };
}

module.exports.get = get;
