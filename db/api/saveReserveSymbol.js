const db = require('ocore/db.js');
const tokenRegistry = require('aabot/token_registry.js');

exports.saveReserveSymbol = async function saveReserveSymbol(aa_address, asset) {
  const symbol = await tokenRegistry.getSymbolByAsset(asset);
  const decimals = await tokenRegistry.getDecimalsBySymbolOrAsset(asset);

  await db.query(`UPDATE markets_assets SET reserve_symbol=?, reserve_decimals=? WHERE aa_address=?`, [symbol !== undefined ? symbol : null, symbol !== undefined ? decimals : 0, aa_address]);
}