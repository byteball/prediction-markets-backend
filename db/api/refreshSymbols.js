const { saveSymbolForAsset } = require('./saveSymbolForAsset');
const { saveReserveSymbol } = require('./saveReserveSymbol');

const db = require('ocore/db.js');

exports.refreshSymbols = async function refreshSymbols() {
  const rows = await db.query("SELECT * FROM markets_assets LEFT JOIN markets ON markets_assets.aa_address = markets.aa_address");

  for (var i = 0; i < rows.length; i++) {
    await saveSymbolForAsset(rows[i].yes_asset);
    await saveSymbolForAsset(rows[i].no_asset);

    if (rows[i].draw_asset) {
      await saveSymbolForAsset(rows[i].draw_asset);
    }

    await saveReserveSymbol(rows[i].aa_address, rows[i].reserve_asset);
  }
}