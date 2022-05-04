const db = require('ocore/db.js');
const mutex = require('ocore/mutex.js');
const wallet_general = require('ocore/wallet_general.js');

exports.savePredictionMarket = async function (aa_address, params) {
  const unlock = await mutex.lock(aa_address);

  await wallet_general.addWatchedAddress(aa_address, null, console.log);

  const {
    category,
    event,
    oracle,
    feed_name,
    reserve_asset,
    comparison,
    datafeed_value,
    datafeed_draw_value,
    end_of_trading_period,
    waiting_period_length,
    issue_fee,
    redeem_fee,
    arb_profit_tax,
    allow_draw
  } = params || {};

  const lowCategory = String(category).toLowerCase().trim();
  let id;

  if (lowCategory) {
    const [row] = await db.query("SELECT * FROM categories WHERE category=?", [lowCategory]);

    if (!row) {
      const res = await db.query("INSERT INTO categories (category) VALUES (?)", [lowCategory]);
      
      id = res.insertId;
    } else {
      id = row.category_id;
    }
  }

  if (aa_address && event && oracle && feed_name !== undefined && datafeed_value !== undefined) {
    const data = [
      aa_address,
      event,
      oracle,
      feed_name,
      reserve_asset ? reserve_asset : "base",
      comparison ? comparison : "==",
      datafeed_value,
      datafeed_draw_value,
      end_of_trading_period,
      waiting_period_length !== undefined ? waiting_period_length : 5 * 24 * 3600,
      issue_fee !== undefined ? issue_fee : 0.01,
      redeem_fee !== undefined ? redeem_fee : 0.02,
      arb_profit_tax !== undefined ? arb_profit_tax : 0.9,
      !!allow_draw,
      id
    ];

    await db.query("INSERT INTO markets (aa_address, event, oracle, feed_name, reserve_asset, comparison, datafeed_value, datafeed_draw_value, end_of_trading_period, waiting_period_length, issue_fee, redeem_fee, arb_profit_tax, allow_draw, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...data]);
    // network.addLightWatchedAa(aa_address, null, console.log);
  } else {
    return await unlock("Error params")
  }

  return await unlock();
}