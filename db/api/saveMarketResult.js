const db = require('ocore/db.js');

exports.saveMarketResult = async function (aa_address, result) {
  await db.query(`UPDATE markets SET result=? WHERE aa_address=?`, [result, aa_address]);
}