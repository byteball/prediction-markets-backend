const db = require('ocore/db.js');

exports.getTradeEventsByMarket = async function (aa_address, options) {
  let filter = '';
  let result = [];
  let count = null;

  if (options) {
    if ('limit' in options) {
      filter += `LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }
  }

  if (aa_address) {
    result = await db.query(`SELECT * FROM trades WHERE aa_address=? ORDER BY timestamp DESC ${filter}`, [aa_address]);
  } else {
    result = await db.query(`SELECT * FROM trades ${filter}`, []);
  }

  if (options.getCount) {
    [{ count }] = await db.query('SELECT COUNT (aa_address) AS count FROM trades WHERE aa_address=?', [aa_address]);
  }

  return {
    data: result,
    count
  }
}