const db = require('ocore/db.js');
// const mutex = require('ocore/mutex.js');
// const wallet_general = require('ocore/wallet_general.js');

exports.saveMarketAsset = async function (aa_address, type, asset) {
  // const unlock = await mutex.lock(aa_address);
  console.log(`saving market asset ${aa_address} ${type} ${asset}`);

  if (type !== 'yes' && type !== 'no' && type !== 'draw' && type !== 'reserve') return null//await unlock("unknown type")

  const [row] = await db.query("SELECT * FROM markets WHERE aa_address=?", [aa_address]);

  if (!row) return  null //await unlock('unknown address');
  
  const [row2] = await db.query("SELECT * FROM market_assets WHERE aa_address=?", [aa_address]);

  if (row2) {
    await db.query(`UPDATE market_assets SET ${type}_asset=? WHERE aa_address=?`, [asset, aa_address]);
  } else {
    await db.query(`INSERT INTO market_assets (aa_address, ${type}_asset) VALUES (?, ?)`, [aa_address, asset]);
  }

  console.log(`saved market asset ${aa_address} ${type} ${asset}`);
  // return await unlock();
}
