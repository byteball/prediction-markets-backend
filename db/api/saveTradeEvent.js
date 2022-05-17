const db = require('ocore/db.js');

exports.saveTradeEvent = async function (data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const length = fields.length;

  return await db.query(`INSERT INTO trade_events (${fields.join(", ")}) VALUES (?${', ?'.repeat(length - 1)})`, values)
}