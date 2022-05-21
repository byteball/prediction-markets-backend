const { default: axios } = require('axios');

const conf = require('ocore/conf.js');

exports.getUSDPriceByAsset = async function (asset, timestamp) {
  const symbol = conf.supported_reserve_assets[asset] ? conf.supported_reserve_assets[asset].symbol : null;

  if (!symbol) return null;

  return await axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${symbol}&tsyms=USD&to=${timestamp}`).then((data) => data.data[symbol].USD).catch(() => 0);
}