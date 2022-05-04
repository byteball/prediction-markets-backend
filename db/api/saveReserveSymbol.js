const db = require('ocore/db.js');
const { getSymbolAndDecimalsByAsset } = require('../../utils');

exports.saveReserveSymbol = async function saveReserveSymbol(aa_address, asset) {
  const { symbol, decimals } = await getSymbolAndDecimalsByAsset(asset);

  await db.query(`UPDATE markets_assets SET reserve_symbol=?, reserve_decimals=? WHERE aa_address=?`, [symbol !== undefined ? symbol : null, symbol !== undefined ? decimals : 0, aa_address]);
}