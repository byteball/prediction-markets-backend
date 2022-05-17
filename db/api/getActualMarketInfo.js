const db = require('ocore/db.js');

exports.getActualMarketInfo = async function (aa_address) {
  const data = await db.query('SELECT yes_price, no_price, draw_price, reserve FROM trade_events WHERE aa_address=? ORDER BY timestamp DESC LIMIT 1', [aa_address]);
  return data[0];
}