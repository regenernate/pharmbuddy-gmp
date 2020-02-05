
module.exports.base_route_path = "scrum";

//manage requests
module.exports.router = async function( req, res, path ) {
  if(!path) path = [];
  if( !getRegisteredDevice(req) ) return bro.redirect( "/" + reg_path + "/" );
  let rp = getResponsibleParty( req );
  if( rp ){ //user is logged in on a registered device
    let rtn;
    if( path.length && path[0] == "report_issue" ){
      if( !req.body ){ //no posted values so show input form
        rtn = renderTemplate( req, pages.report_issue, { categories:getCategoryList(), responsible_party:rp } );
      }else{
        let ci = createIssue( req.body.category, req.body.description, req.body.reporter );
        return bro.redirect( "/scrum/" );
      }
    }else if( path.length && path[0] == "update_status" ){
      let cu = updateIssueStatus( req.body.key, req.body.status, rp );
      return bro.redirect("/scrum/");
    }else{
      let iss = getIssues();
      rtn = renderTemplate( req, pages.issue_list, { issues:iss, statuses:getStatusList() })
    }
    return bro.get( true, rtn );
  }else return bro.redirect("/login/"); //otherwise redirect to login
}

//external requirements
const {base_route_path : reg_path} = require('./registration_router');

const bro = require('../server/bro');
const {getResponsibleParty, getRegisteredDevice} = require('../tools/sessions/session_util');
const { compileTemplates } = require('../views/template_manager');
const {renderTemplate, renderError} = require('../tools/rendering/render_util');
const {getStatusList, getIssues, getCategoryList, createIssue, updateIssueStatus} = require( '../tools/bug_tracking/bug_tracker' );

function initialize(){
  //load view templates
  //use filesys_util to generate paths and load them from the pages object
  let fsu = require( "../tools/filesys/filesys_util");
  pages = compileTemplates( fsu.generatePaths( { report_issue:1, issue_list:1 }, "./views/mains/", ".handlebars", true ), true );
  fsu = null;
}

var pages;
initialize();
