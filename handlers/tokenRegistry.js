const db = require('ocore/db.js');
const conf = require('ocore/conf.js');

exports.tokenRegistryResponseHandler = async function (objResponse) {
  if (objResponse.bounced)
    return;
  console.log(`handling token registry AA response`, JSON.stringify(objResponse, null, 2));
  const updatedStateVars = objResponse.updatedStateVars[conf.tokenRegistryAaAddress];
  const updatedStateVarNames = Object.keys(updatedStateVars);

  const s2aVarName = updatedStateVarNames.find((name) => name.startsWith("s2a_"));
  const decimalsVarName = updatedStateVarNames.find((name) => name.startsWith("decimals_"));

  if (s2aVarName && updatedStateVars[s2aVarName]) {
    const asset = updatedStateVars[s2aVarName].value;
    if (!asset || !updatedStateVars[`a2s_${asset}`]) return console.log(`no asset in ${s2aVarName}`);

    const symbol = updatedStateVars[`a2s_${asset}`].value;
    if (!symbol) return console.log(`no symbol in ${s2aVarName}`);

    const decimals = (decimalsVarName && updatedStateVars[decimalsVarName] !== undefined) ? updatedStateVars[decimalsVarName].value : 0;

    const [market_assets] = await db.query("SELECT * FROM market_assets WHERE yes_asset=? OR no_asset=? OR draw_asset=?", [asset, asset, asset]);

    if (!market_assets) return console.log(`no market assets record in ${s2aVarName} symbol ${symbol} asset ${asset}`);

    const type = asset === market_assets.yes_asset ? 'yes' : (asset === market_assets.no_asset ? 'no' : 'draw');

    await db.query(`UPDATE market_assets SET ${type}_symbol=?, ${type}_decimals=? WHERE ${type}_asset=?`, [symbol, decimals, asset]);
    await db.query(`UPDATE market_assets SET reserve_symbol=?, reserve_decimals=? WHERE reserve_asset=?`, [symbol, decimals, asset]);
    console.log(`saved symbol`, symbol, asset);
  }
  else
    console.log('no s2a var')
}