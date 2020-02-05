
module.exports.renderError = function( req, error, layout ){
  let sess = { main:error, session:{device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req )} };
  return executeTemplate( null, sess, layout );
}

module.exports.renderTemplate = function( req, template, data, layout ){
  let d;
  if( !data ) d = { main:null };
  else d = { main:data };
  d.session = { device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req ) };
  return executeTemplate( template, d, layout )
}

module.exports.renderStatic = function( req, content, layout ){
  let d;
  d = { main:content };
  d.session = { device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req ) };
  return executeTemplate( null, d, layout )
}

module.exports.renderData = function( data ){
  return JSON.stringify( data );
}

const { executeTemplate } = require( "../../views/template_manager");
const { getRegisteredDevice, getResponsibleParty } = require( "../sessions/session_util");
