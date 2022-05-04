const network = require('ocore/network.js');

exports.getStateVars = async function getStateVars(aa_address) {
  return new Promise((resolve) => {
    network.requestFromLightVendor('light/get_aa_state_vars', {
      address: aa_address
    }, function (ws, request, objResponse) {
      if (objResponse.error) {
        console.log("Error when requesting state vars for " + aa_address + ": " + objResponse.error);
        resolve({});
      } else
        resolve(objResponse);
    });
  });
}