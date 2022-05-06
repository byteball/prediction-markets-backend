const { default: axios } = require('axios');

const conf = require('ocore/conf.js');

exports.getUSDPriceByAsset = async function (asset, timestamp) {
  const supported_reserve_assets = Object.entries(conf.supported_reserve_assets);

  const [symbol] = supported_reserve_assets.find(([_, a]) => a === asset) || [];

  if (!symbol) return null;

  return await axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${symbol}&tsyms=USD&to=${timestamp}`).then((data) => data.data[symbol].USD).catch(() => 0);
}