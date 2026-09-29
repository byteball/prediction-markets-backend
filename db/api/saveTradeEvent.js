const db = require('ocore/db.js');

exports.saveTradeEvent = async function (data) {
  // tokenless markets often send nothing back, so there is no response unit, but it's the primary key
  const row = { ...data, response_unit: data.response_unit || `${data.trigger_unit}_${data.aa_address}` };

  const fields = Object.keys(row);
  const values = Object.values(row);
  const length = fields.length;

  return await db.query(`INSERT INTO trades (${fields.join(", ")}) VALUES (?${', ?'.repeat(length - 1)})`, values)
}