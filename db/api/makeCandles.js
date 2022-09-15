const moment = require('moment');
const db = require('ocore/db.js');
const { getUSDPriceByAsset } = require('../../utils/getUSDPriceByAsset');
const { getMarketParams } = require('./getMarketParams');

exports.makeCandles = async function ({ aa_address, timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, reserve, coef }) {
  const start_hourly_timestamp = moment.unix(timestamp).utc().startOf("hour").unix();
  const start_daily_timestamp = moment.unix(timestamp).utc().startOf("day").unix();

  const params = await getMarketParams(aa_address);
  const reserve_to_usd_rate = await getUSDPriceByAsset(params.reserve_asset, timestamp);

  const [existHourlyCandle] = await db.query("SELECT * FROM hourly_candles WHERE aa_address = ? AND start_timestamp = ?", [aa_address, start_hourly_timestamp]);

  if (existHourlyCandle) {
    db.query("UPDATE hourly_candles SET close_yes_price = ?, close_no_price = ?, close_draw_price = ?, close_supply_yes = ?, close_supply_no = ?, close_supply_draw = ?, close_reserve = ?, close_coef = ? WHERE start_timestamp = ? AND aa_address = ?", [
      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,
      start_hourly_timestamp,
      aa_address
    ]);
  } else {
    db.query("INSERT INTO hourly_candles (aa_address, open_yes_price, open_no_price, open_draw_price, open_supply_yes, open_supply_no, open_supply_draw, open_reserve, open_coef, close_yes_price, close_no_price, close_draw_price, close_supply_yes, close_supply_no, close_supply_draw, close_reserve, close_coef, start_timestamp, reserve_to_usd_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)", [
      aa_address,

      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,

      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,

      start_hourly_timestamp,
      reserve_to_usd_rate
    ]);
  }

  const [existDailyCandle] = await db.query("SELECT * FROM daily_candles WHERE aa_address = ? AND start_timestamp = ?", [aa_address, start_daily_timestamp]);

  if (existDailyCandle) {
    db.query("UPDATE daily_candles SET close_yes_price = ?, close_no_price = ?, close_draw_price = ?, close_supply_yes = ?, close_supply_no = ?, close_supply_draw = ?, close_reserve = ?, close_coef = ? WHERE start_timestamp = ? AND aa_address = ?", [
      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,
      start_daily_timestamp,
      aa_address
    ]);
  } else {
    db.query("INSERT INTO daily_candles (aa_address, open_yes_price, open_no_price, open_draw_price, open_supply_yes, open_supply_no, open_supply_draw, open_reserve, open_coef, close_yes_price, close_no_price, close_draw_price, close_supply_yes, close_supply_no, close_supply_draw, close_reserve, close_coef, start_timestamp, reserve_to_usd_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)", [
      aa_address,

      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,

      yes_price,
      no_price,
      draw_price,
      supply_yes,
      supply_no,
      supply_draw,
      reserve,
      coef,

      start_daily_timestamp,
      reserve_to_usd_rate
    ]);
  }
}