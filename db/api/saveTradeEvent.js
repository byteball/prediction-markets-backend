const db = require('ocore/db.js');
const { getUSDPriceByAsset } = require('../../utils/getUSDPriceByAsset');
const { getMarketParams } = require('./getMarketParams');

exports.saveTradeEvent = async function (data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const length = fields.length;
  const params = await getMarketParams(data.aa_address);

  const reserve_to_usd_rate = await getUSDPriceByAsset(params.reserve_asset, data.timestamp);

  return await db.query(`INSERT INTO trade_events (${fields.join(", ")}, reserve_to_usd_rate) VALUES (?, ?${', ?'.repeat(length - 1)})`, [...values, reserve_to_usd_rate])
}