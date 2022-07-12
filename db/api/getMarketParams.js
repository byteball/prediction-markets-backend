const db = require('ocore/db.js');

exports.getMarketParams = async function (address) {
  return await db.query('SELECT * from markets WHERE aa_address=?', [address]).then(data => data[0]).catch(() => null);
}