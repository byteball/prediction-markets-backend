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
  const msg = joint.unit.messages.find(m => m.app === 'data');
  const payload = msg ? msg.payload : {};
  const aa_address = objResponse.aa_address;

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

  if (responseVars && ('next_coef' in responseVars) && ('arb_profit_tax' in responseVars) && ('fee' in responseVars)) {
    const existsAmountInPayload = 'yes_amount' in payload || 'no_amount' in payload || 'draw_amount' in payload;

    const tradeData = {
      aa_address: aa_address,
      type: ('type' in payload) ? 'buy_by_type' : (existsAmountInPayload ? 'buy' : 'redeem'),
      supply_yes: responseVars.supply_yes,
      supply_no: responseVars.supply_no,
      supply_draw: responseVars.supply_draw || 0,
      yes_amount: responseVars.yes_amount,
      no_amount: responseVars.no_amount,
      draw_amount: responseVars.draw_amount || 0,
      yes_price: responseVars.yes_price || 0,
      no_price: responseVars.no_price || 0,
      draw_price: responseVars.draw_price || 0,
      coef: responseVars.next_coef,
      reserve: responseVars.next_reserve,
      timestamp: objResponse.timestamp,
      response_unit: objResponse.response_unit
    };

    await marketDB.api.saveTradeEvent(tradeData)

    await marketDB.api.makeCandles(tradeData)
  }

  return unlock()
};