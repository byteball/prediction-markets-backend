const dag = require('aabot/dag.js');
const conf = require('ocore/conf.js');
const mutex = require('ocore/mutex.js');

const marketDB = require('../db');
const { notifyAdmin } = require('../notifications');

const RETRY_TIMEOUT = 20 * 60 * 1000; // 20 min
const MAX_RETRY_COUNT = 40;

const attemptList = {}; // address:count

const tryRegSymbols = async (address, data) => {
  try {
    await marketDB.api.registerSymbols(address, data);
  } catch (e) {
    console.error('reg symbols error', e)
    if (!(address in attemptList)) {
      attemptList[address] = 1;
    } else {
      if (attemptList[address] >= MAX_RETRY_COUNT) {
        notifyAdmin(`too many attempts to register a symbol (${conf.testnet ? 'testnet' : 'livenet'})`, `
          address: ${address}
          error: "${e}"
        `);
      } else {
        attemptList[address] = attemptList[address] + 1;
      }
    }

    setTimeout(async () => {
      await tryRegSymbols(address, data);
    }, RETRY_TIMEOUT);
  }
}

exports.responseHandler = async function (objResponse) {
  const unlock = await mutex.lock('responseHandler');
  console.log(`handling response`, JSON.stringify(objResponse, null, 2));

  if (objResponse.response.error)
    return unlock('ignored response with error: ' + objResponse.response.error);

  const trigger_unit = objResponse.trigger_unit;
  const responseVars = objResponse.response.responseVars || {};
  const timestamp = objResponse.timestamp;
  const joint = await dag.readJoint(trigger_unit);
  const msg = joint.unit.messages.find(m => m.app === 'data');
  const payload = msg ? msg.payload : {};
  const aa_address = objResponse.aa_address;

  if (('prediction_address' in responseVars) && objResponse.objResponseUnit.messages) {
    if ((timestamp > conf.factoryUpgradeFixQuietPeriodTimestamp && aa_address === conf.factoryAas[0]) || (timestamp > conf.factoryUpgradeRemoveIssueFeeForLiqTimestamp && aa_address === conf.factoryAas[1])) {
      return unlock('ignored AA', responseVars.prediction_address);
    }

    const defMsg = objResponse.objResponseUnit.messages.find(({ app }) => app === 'definition');

    if (!defMsg) return unlock('no def msg', responseVars.prediction_address)

    const base_aa = defMsg.payload.definition[1].base_aa;

    if (joint && joint.unit && joint.unit.messages) {
      await marketDB.api.savePredictionMarket(responseVars.prediction_address, payload, timestamp, base_aa);
      await marketDB.api.saveReserveSymbol(responseVars.prediction_address, payload.reserve_asset);

      if (conf.automaticSymbolsReg && timestamp > 1661955871) { // automatic registration start time
        await tryRegSymbols(responseVars.prediction_address, payload);
      }
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

  const isAddLiquidity = !('arb_profit_tax' in responseVars);

  if (responseVars && ('next_coef' in responseVars) && ('arb_profit_tax' in responseVars || isAddLiquidity)) {
    const existsAmountInPayload = 'yes_amount' in payload || 'no_amount' in payload || 'draw_amount' in payload;
    const { reserve_asset } = await marketDB.api.getMarketAssets(aa_address);

    let reserve_amount = 0;
    if (existsAmountInPayload || isAddLiquidity || ('type' in payload)) {
      if (joint.unit && joint.unit.messages) {
        const msg = joint?.unit?.messages?.find(({ app, payload }) => app === 'payment' && (reserve_asset === 'base' ? !('asset' in payload) : payload.asset === reserve_asset));

        if (msg) {
          const outputs = msg.payload.outputs;
          if (outputs) {
            const output = outputs.find(({ address }) => address === aa_address);
            if (output && output.amount !== 1e4) {
              reserve_amount = output.amount;
            }
          }
        }
      }

    } else { // redeem
      if (!objResponse.objResponseUnit)
        throw Error(`no objResponseUnit in ${JSON.stringify(objResponse)}`);
      const messages = objResponse.objResponseUnit.messages;

      if (messages.length === 1) {
        const outputs = messages[0].payload.outputs;
        const output = outputs.find(({ address }) => address !== aa_address);
        reserve_amount = output.amount;
      }
    }

    const tradeData = {
      aa_address: aa_address,
      type: isAddLiquidity ? 'add_liquidity' : ('type' in payload) ? 'buy_by_type' : (existsAmountInPayload ? 'buy' : 'redeem'),
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
      timestamp,
      response_unit: objResponse.response_unit,
      reserve_amount: reserve_amount || 0,
      trigger_address: objResponse.trigger_address,
      trigger_unit: objResponse.trigger_unit
    };

    await marketDB.api.saveTradeEvent(tradeData)

    await marketDB.api.makeCandles(tradeData)
  }

  if (responseVars.result) {
    await marketDB.api.saveMarketResult(aa_address, responseVars.result, timestamp);
  }

  if (responseVars.profit) {
    const assets = await marketDB.api.getMarketAssets(aa_address);
    const params = await marketDB.api.getMarketParams(aa_address);
    const actualData = await marketDB.api.getActualMarketInfo(aa_address);

    if (!assets || !params || !actualData) {
      return unlock();
    }

    const winner = params.result;

    if (!winner) return unlock();

    const winnerAsset = winner === 'yes' ? assets.yes_asset : (winner === 'no' ? assets.no_asset : assets.draw_asset);

    const profit = responseVars.profit;
    const payoutMsg = joint.unit.messages.find(({ app, payload }) => app === 'payment' && payload.asset === winnerAsset);
    const output = payoutMsg.payload.outputs.find(({ address }) => address === aa_address);
    const new_reserve = actualData.reserve - profit;
    const new_winner_supply = actualData[`supply_${winner}`] - output.amount;
    const winnerPrice = new_reserve / new_winner_supply;

    await marketDB.api.saveTradeEvent({
      aa_address,
      response_unit: objResponse.response_unit,
      [`${winner}_amount`]: output.amount,
      reserve: new_reserve,
      coef: actualData.coef,
      type: 'claim_profit',
      timestamp,
      supply_yes: actualData.supply_yes,
      supply_no: actualData.supply_no,
      supply_draw: actualData.supply_draw,
      yes_price: 0,
      no_price: 0,
      draw_price: 0,
      ...{ [`supply_${winner}`]: new_winner_supply, [`${winner}_price`]: winnerPrice },
      trigger_address: objResponse.trigger_address,
      reserve_amount: responseVars.profit,
      trigger_unit: objResponse.trigger_unit
    })
  }

  return unlock()
};