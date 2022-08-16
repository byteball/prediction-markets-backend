const db = require('ocore/db.js');

exports.saveMarketResult = async function (aa_address, result, ts) {
  await db.query(`UPDATE markets SET result=?, committed_at=? WHERE aa_address=?`, [result, ts, aa_address]);
}