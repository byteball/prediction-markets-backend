const { default: axios } = require('axios');
const { isInteger } = require('lodash');
const db = require('ocore/db.js');
const conf = require('ocore/conf.js');

const marketDB = require('../../db');
const limit = 1000;

let cacheRate = {
  lastUpdate: 0,
  data: {}
}

module.exports = async (request, reply) => {
  const pageInParams = request.params.page;

  const page = (isInteger(pageInParams) && pageInParams > 0) ? request.params.page : 1;

  const offset = (page - 1) * limit;

  let rows;

  try {
    rows = await db.query(`SELECT * FROM markets LEFT JOIN categories USING (category_id) LEFT JOIN markets_assets USING (aa_address) ORDER BY markets.end_of_trading_period DESC, markets.total_reserve DESC LIMIT ${limit} OFFSET ${offset}`);
  } catch {
    console.error("get markets error");
    reply.send([]);
  }

  try {
    const gettersActualData = rows.map((row, i) => marketDB.api.getActualMarketInfo(row.aa_address).then(data => rows[i] = { ...rows[i], ...data }));
    const gettersCandle = rows.map((row, i) => marketDB.api.getCandles(row.aa_address, 'hourly', true).then(data => rows[i].candles = data));

    await Promise.all(gettersActualData);
    await Promise.all(gettersCandle);
  } catch (e) {
    console.error('error in getters', e)
  }


  if (Object.keys(cacheRate.data).length === 0 || cacheRate.lastUpdate < Date.now() - (1800 * 1000)) {
    try {
      const data = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.keys(conf.supported_reserve_assets).join(",")}&tsyms=USD`).then(({ data }) => {
        const res = {};

        Object.entries(data).forEach(([name, value]) => res[conf.supported_reserve_assets[name]] = value);

        return res;
      }).catch((err) => console.error(err));

      cacheRate = {
        data,
        lastUpdate: Date.now()
      }
    } catch (err) {
      console.error(err)
    }
  }

  try {
    const filteredRows = rows.sort((b, a) => ((a.reserve || 0) / (10 ** a.reserve_decimals)) * cacheRate.data[a.reserve_asset].USD - ((b.reserve || 0) / 10 ** b.reserve_decimals) * cacheRate.data[b.reserve_asset].USD)

    reply.send(filteredRows);
  } catch (e) {
    console.error(e)
  }
}