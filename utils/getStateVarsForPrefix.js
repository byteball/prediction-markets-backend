const network = require('ocore/network.js');

exports.getStateVarsForPrefix = async function (aa_address, prefix, start = '0', end = 'z', firstCall = true) {
  return new Promise(function (resolve, reject) {
    if (firstCall)
      prefix = prefix.slice(0, -1);
    const CHUNK_SIZE = 2000; // server wouldn't accept higher chunk size

    if (start === end)
      return getStateVarsForPrefix(aa_address, prefix + start, '0', 'z').then(resolve).catch(reject); // we append prefix to split further

    network.requestFromLightVendor('light/get_aa_state_vars', {
      address: aa_address,
      var_prefix_from: prefix + start,
      var_prefix_to: prefix + end,
      limit: CHUNK_SIZE
    }, function (ws, request, objResponse) {
      if (objResponse.error)
        return reject(objResponse.error);

      if (Object.keys(objResponse).length >= CHUNK_SIZE) { // we reached the limit, let's split in two ranges and try again
        const delimiter = Math.floor((end.charCodeAt(0) - start.charCodeAt(0)) / 2 + start.charCodeAt(0));
        Promise.all([
          getStateVarsForPrefix(aa_address, prefix, start, String.fromCharCode(delimiter), false),
          getStateVarsForPrefix(aa_address, prefix, String.fromCharCode(delimiter + 1), end, false)
        ]).then(function (results) {
          return resolve({ ...results[0], ...results[1] });
        }).catch(function (error) {
          return reject(error);
        })
      } else {
        return resolve(objResponse);
      }

    });
  });
}