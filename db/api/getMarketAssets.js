const db = require('ocore/db.js');

exports.getMarketAssets = async function (address) {
    return await db.query('SELECT * from market_assets WHERE aa_address=?', [address]).then(data => data[0]);
}