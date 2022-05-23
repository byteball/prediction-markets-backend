const db = require('ocore/db.js');
const tokenRegistry = require('aabot/token_registry.js');

exports.saveSymbolForAsset = async function saveSymbolForAsset(asset) {
  const [markets_assets] = await db.query("SELECT * FROM markets_assets WHERE yes_asset=? OR no_asset=? OR draw_asset=?", [asset, asset, asset]);

  if (!markets_assets || !asset) return;

  const type = asset === markets_assets.yes_asset ? 'yes' : (asset === markets_assets.no_asset ? 'no' : 'draw');

  const symbol = await tokenRegistry.getSymbolByAsset(asset);
  const decimals = await tokenRegistry.getDecimalsBySymbolOrAsset(asset);

  await db.query(`UPDATE markets_assets SET ${type}_symbol=?, ${type}_decimals=? WHERE ${type}_asset=?`, [symbol !== undefined ? symbol : null, symbol !== undefined ? decimals : 0, asset]);
}