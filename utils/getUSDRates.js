const { default: axios } = require('axios');

const conf = require('ocore/conf.js');

const CACHE_LIFETIME = 30 * 60 * 1000;
const MIN_REQUEST_INTERVAL = 60 * 1000; // even if the previous request failed

let rates = {}; // asset: price in USD
let lastUpdate = 0;
let lastRequest = 0;

// current prices of the reserve assets, the last known ones if coingecko is unavailable
exports.getUSDRates = async function () {
  const isOutdated = Object.keys(rates).length === 0 || lastUpdate < Date.now() - CACHE_LIFETIME;

  if (!isOutdated || lastRequest > Date.now() - MIN_REQUEST_INTERVAL) return rates;

  lastRequest = Date.now();

  try {
    const ids = Object.values(conf.supportedReserveAssets).map(({ coingecko_id }) => coingecko_id);

    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`, {
      headers: conf.coingeckoApiKey ? { 'x-cg-demo-api-key': conf.coingeckoApiKey } : {}
    });

    const newRates = {};

    Object.entries(conf.supportedReserveAssets).forEach(([asset, { coingecko_id }]) => {
      newRates[asset] = data[coingecko_id].usd;
    });

    rates = newRates;
    lastUpdate = Date.now();
  } catch (err) {
    console.error('get rates error', err.response ? err.response.status : '', err.message);
  }

  return rates;
}
