


module.exports.checkInventory = async function( request, amounts ){
  //iterate over items and check if there is enough inventory for each
  let r = {};
  //return an object with same keys indicating inventory status
  for( let i in amounts ){
    r[i] = true;
  }
  return r;
}

module.exports.pullInventory = async function( request, amounts ){
  //actually decrement the inventory counts for each item in the request
  
}
