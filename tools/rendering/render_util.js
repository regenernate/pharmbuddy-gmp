
module.exports.renderError = function( req, error ){
  let sess = { main:error, session:{device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req )} };
  return executeTemplate( null, sess );
}

module.exports.renderTemplate = function( req, template, data ){
  let d;
  if( !data ) d = { main:null };
  else d = { main:data };
  d.session = { device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req ) };
  return executeTemplate( template, d )
}

module.exports.renderStatic = function( req, content ){
  let d;
  d = { main:content };
  d.session = { device_name:getRegisteredDevice( req ), responsible_party:getResponsibleParty( req ) };
  return executeTemplate( null, d )
}

const { executeTemplate } = require( "../../views/template_manager");
const { getRegisteredDevice, getResponsibleParty } = require( "../sessions/session_util");
