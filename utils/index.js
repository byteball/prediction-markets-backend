const { getStateVars } = require('./getStateVars');
const { getStateVarsForPrefix } = require('./getStateVarsForPrefix');
const { getStateVarsForPrefixes } = require('./getStateVarsForPrefixes');
const { getSymbolAndDecimalsByAsset } = require('./getSymbolAndDecimalsByAsset');

module.exports = {
  getStateVars: getStateVars,
  getStateVarsForPrefix: getStateVarsForPrefix,
  getStateVarsForPrefixes: getStateVarsForPrefixes,
  getSymbolAndDecimalsByAsset: getSymbolAndDecimalsByAsset
}