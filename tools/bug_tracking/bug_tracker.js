const STATUS_NEW = "newly reported";
const moment = require("moment");

var key_count = 0;
var issues = {
  view:[],
  logical:[],
  workflow:[],
  process:[]
};

module.exports.createIssue = function( category, description, reporter ){
  console.log("bug_tracker.log in createIssue :: " + category + " : " + description + " : " + reporter );
  let r = false;
  if( isValidCategory(category) ){
    issues[category].push( { key:getKey(), description:description, status:STATUS_NEW, date_reported:moment().format('x'), reporter:reporter });
    r = true;
  }
  return r;
}


module.exports.getIssues = function( categories, include_closed ){
  //return an array of issues matching criteria sent
  if( !categories || categories === true ) categories = getCategoryList();
  else for( let i in categories ) categories[i] = categories[i].toLowerCase();
  let rtn = [];
  let l;
  for( let i in issues ){
    if( categories.indexOf( i ) < 0 ) continue;
    l = issues[i].length;
    for( let j=0; j<l; j++){
      //include issue if it is open or include_closed is true
      if( !issues[i][j].closed || include_closed ) rtn.push( { key:issues[i][j].key, category:i, description:issues[i][j].description, status:issues[i][j].status, date_reported:issues[i][j].date_reported, reporter:issues[i][j].reporter } );
    }
  }
  console.log("bug_tracker.log in getIssues :: found " +  rtn.length + " issues matching ( " + categories.toString() + " ).");
  return rtn;
}

module.exports.getCategoryList = getCategoryList;

function getCategoryList(){
  let rtn = [];
  for( let i in issues ){
    rtn.push( i );
  }
  return rtn;
}

function isValidCategory( category ){
  return issues.hasOwnProperty( category.toLowerCase() );
}

function getKey(){
  return ++key_count;
}
