const { getStateVarsForPrefix } = require("./getStateVarsForPrefix");

exports.getStateVarsForPrefixes = async function (aa_address, arrPrefixes) {
  return new Promise(function (resolve) {
    Promise.all(arrPrefixes.map((prefix) => {
      return getStateVarsForPrefix(aa_address, prefix)
    })).then((arrResults) => {
      return resolve(Object.assign({}, ...arrResults));
    }).catch((error) => {
      return resolve({});
    });
  });
}