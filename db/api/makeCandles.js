const moment = require('moment');
const db = require('ocore/db.js');
const { getUSDPriceByAsset } = require('../../utils/getUSDPriceByAsset');
const { getMarketParams } = require('./getMarketParams');

exports.makeCandles = async function ({ aa_address, timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, reserve, coef }) {
  const start_hourly_timestamp = moment.unix(timestamp).utc().startOf("hour").unix();
  const start_day_timestamp = moment.unix(timestamp).utc().startOf("day").unix();

  const params = await getMarketParams(aa_address);
  const reserve_to_usd_rate = await getUSDPriceByAsset(params.reserve_asset, timestamp);

  db.query("REPLACE INTO hourly_candles (aa_address, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, reserve, start_timestamp, reserve_to_usd_rate, coef) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    aa_address,
    yes_price,
    no_price,
    draw_price,
    supply_yes,
    supply_no,
    supply_draw,
    reserve,
    start_hourly_timestamp,
    reserve_to_usd_rate,
    coef
  ]);

  db.query("REPLACE INTO daily_candles (aa_address, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, reserve, start_timestamp, reserve_to_usd_rate, coef) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    aa_address,
    yes_price,
    no_price,
    draw_price,
    supply_yes,
    supply_no,
    supply_draw,
    reserve,
    start_day_timestamp,
    reserve_to_usd_rate,
    coef
  ]);
}