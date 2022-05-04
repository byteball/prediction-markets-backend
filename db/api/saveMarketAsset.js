const db = require('ocore/db.js');
const mutex = require('ocore/mutex.js');
// const wallet_general = require('ocore/wallet_general.js');

exports.saveMarketAsset = async function (aa_address, type, asset) {
  const unlock = await mutex.lock(aa_address);

  // await wallet_general.addWatchedAddress(aa_address, null, console.log);
  // console.error('aa_address', aa_address)
  if (type !== 'yes' && type !== 'no' && type !== 'draw') return await unlock("unknown type")

  const [row] = await db.query("SELECT * FROM markets WHERE aa_address=?", [aa_address]);

  if (!row) return await unlock('unknown address');
  
  const [row2] = await db.query("SELECT * FROM markets_assets WHERE aa_address=?", [aa_address]);

  if (row2) {
    await db.query(`UPDATE markets_assets SET ${type}_asset=? WHERE aa_address=?`, [asset, aa_address]);
  } else {
    await db.query(`INSERT INTO markets_assets (aa_address, ${type}_asset) VALUES (?, ?)`, [aa_address, asset]);
  }

  return await unlock();
}