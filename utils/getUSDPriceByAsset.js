const { default: axios } = require('axios');

const conf = require('ocore/conf.js');

const WINDOW = 2 * 24 * 3600; // coingecko returns hourly prices for ranges of 2+ days

exports.getUSDPriceByAsset = async function (asset, timestamp) {
  const id = conf.supportedReserveAssets[asset] ? conf.supportedReserveAssets[asset].coingecko_id : null;

  if (!id) return null;

  return await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart/range?vs_currency=usd&from=${timestamp - WINDOW}&to=${timestamp}`, {
    headers: conf.coingeckoApiKey ? { 'x-cg-demo-api-key': conf.coingeckoApiKey } : {}
  }).then(({ data }) => data.prices[data.prices.length - 1][1]).catch(() => 0);
}
