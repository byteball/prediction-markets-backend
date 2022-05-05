const db = require('ocore/db.js');

exports.getAllTradeEventsByMarketAddress = async function (aa_address) {
  if (aa_address) {
    return await db.query('SELECT * FROM trade_events WHERE aa_address=?', [aa_address]);
  } else {
    return await db.query('SELECT * FROM trade_events', []);
  }
}