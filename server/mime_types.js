
const mimeTypes = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg':'image/jpeg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.svg': 'application/image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf'
};

module.exports.getMimeTypes = function( subset ){
  var rtn = {};
  if( !subset ) subset = mimeTypes;
  for( var i in mimeTypes ){
    if( subset.hasOwnProperty( i ) ) rtn[i] = mimeTypes[i];
  }
  return rtn;
}
