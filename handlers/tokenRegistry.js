const db = require('ocore/db.js');
const conf = require('ocore/conf.js');

exports.tokenRegistryResponseHandler = async function (objResponse) {
  const updatedStateVars = objResponse.updatedStateVars[conf.token_registry_aa_address];
  const updatedStateVarNames = Object.keys(updatedStateVars);

  const s2aVarName = updatedStateVarNames.filter((name) => name.startsWith("s2a_"));
  const decimalsVarName = updatedStateVarNames.filter((name) => name.startsWith("decimals_"));

  if (s2aVarName) {
    const asset = updatedStateVars[s2aVarName].value;
    const symbol = updatedStateVars[`a2s_${asset}`].value;
    const decimals = decimalsVarName ? updatedStateVars[decimalsVarName].value : 0;

    if (asset && symbol) {
      const [markets_assets] = await db.query("SELECT * FROM markets_assets WHERE yes_asset=? OR no_asset=? OR draw_asset=?", [asset, asset, asset]);

      if (!markets_assets) return;

      const type = asset === markets_assets.yes_asset ? 'yes' : (asset === markets_assets.no_asset ? 'no' : 'draw');

      await db.query(`UPDATE markets_assets SET ${type}_symbol=?, ${type}_decimals=? WHERE ${type}_asset=?`, [symbol, decimals, asset]);

      await db.query(`UPDATE markets_assets SET reserve_symbol=?, reserve_decimals=? WHERE reserve_asset=?`, [symbol, decimals, asset]);
    }
  }
}