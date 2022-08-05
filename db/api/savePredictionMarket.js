const db = require('ocore/db.js');
const mutex = require('ocore/mutex.js');
const wallet_general = require('ocore/wallet_general.js');
const conf = require('ocore/conf.js');
const moment = require('moment');

const { saveMarketAsset } = require('./saveMarketAsset');

exports.savePredictionMarket = async function (aa_address, params, timestamp) {
  const unlock = await mutex.lock(aa_address);

  // ignore if unknown reserve
  if (!(params.reserve_asset in conf.supportedReserveAssets)) return unlock();

  await wallet_general.addWatchedAddress(aa_address, null, console.log);

  const {
    oracle,
    feed_name,
    reserve_asset,
    comparison,
    datafeed_value,
    datafeed_draw_value,
    event_date,
    waiting_period_length,
    issue_fee,
    redeem_fee,
    arb_profit_tax,
    allow_draw,
    quiet_period
  } = params || {};

  if (aa_address && oracle && feed_name !== undefined && datafeed_value !== undefined) {
    const data = [
      aa_address,
      oracle,
      feed_name,
      reserve_asset ? reserve_asset : "base",
      comparison ? comparison : "==",
      datafeed_value,
      datafeed_draw_value,
      moment.utc(event_date, 'YYYY-MM-DDTHH:mm:ss').utc().unix(),
      waiting_period_length !== undefined ? waiting_period_length : 5 * 24 * 3600,
      issue_fee !== undefined ? issue_fee : 0.01,
      redeem_fee !== undefined ? redeem_fee : 0.02,
      arb_profit_tax !== undefined ? arb_profit_tax : 0.9,
      !!allow_draw,
      quiet_period !== undefined ? quiet_period : 0
    ];

    await db.query("INSERT INTO markets (aa_address, oracle, feed_name, reserve_asset, comparison, datafeed_value, datafeed_draw_value, event_date, waiting_period_length, issue_fee, redeem_fee, arb_profit_tax, allow_draw, quiet_period, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...data, timestamp]);

    await saveMarketAsset(aa_address, 'reserve', reserve_asset || "base");
  } else {
    return await unlock("Error params");
  }

  return await unlock();
}