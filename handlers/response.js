const dag = require('aabot/dag.js');
const mutex = require('ocore/mutex.js')
const marketDB = require('../db');

exports.responseHandler = async function (objResponse) {
  const unlock = await mutex.lock('responseHandler');

  if (objResponse.response.error)
    return unlock('ignored response with error: ' + objResponse.response.error);

  const trigger_unit = objResponse.trigger_unit;
  const responseVars = objResponse.response.responseVars || {};
  const joint = await dag.readJoint(trigger_unit);
  const payload = joint.unit.messages.find(m => m.app === 'data').payload;

  if (('prediction_address' in responseVars)) {
    if (joint && joint.unit && joint.unit.messages) {
      await marketDB.api.savePredictionMarket(responseVars.prediction_address, payload);
    }
  }

  if (responseVars.yes_asset) {
    await marketDB.api.saveMarketAsset(payload.to || objResponse.aa_address, 'yes', payload.yes_asset || responseVars.yes_asset)
  }

  if (responseVars.no_asset) {
    await marketDB.api.saveMarketAsset(payload.to || objResponse.aa_address, 'no', payload.no_asset || responseVars.no_asset)
  }

  if (responseVars.draw_asset) {
    await marketDB.api.saveMarketAsset(payload.to || objResponse.aa_address, 'draw', payload.draw_asset || responseVars.draw_asset)
  }

  return unlock()
};