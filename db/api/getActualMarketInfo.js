const db = require('ocore/db.js');

exports.getActualMarketInfo = async function (aa_address) {
  const data = await db.query('SELECT yes_price, no_price, draw_price, reserve, supply_yes, supply_no, supply_draw, coef FROM trades WHERE aa_address=? ORDER BY timestamp DESC LIMIT 1', [aa_address]);
  return data[0] || [];
}