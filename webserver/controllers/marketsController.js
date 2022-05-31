const { default: axios } = require('axios');
const { isInteger } = require('lodash');
const db = require('ocore/db.js');
const conf = require('ocore/conf.js');
const moment = require('moment');

const abbreviations = require('../../abbreviations.json');
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
  const now = moment.utc().unix();

  let rows;

  try {
    rows = await db.query(`SELECT * FROM markets LEFT JOIN categories USING (category_id) LEFT JOIN markets_assets USING (aa_address) ORDER BY markets.end_of_trading_period DESC, markets.total_reserve DESC LIMIT ${limit} OFFSET ${offset}`);
  } catch {
    console.error("get markets error");
    reply.send([]);
  }

  try {
    const gettersActualData = rows.map((row, i) => marketDB.api.getActualMarketInfo(row.aa_address).then(data => rows[i] = { ...rows[i], ...data }));
    const gettersCandle = rows.map((row, i) => marketDB.api.getCandles({ aa_address: row.aa_address, type: 'hourly', onlyYesPrices: true }).then(data => rows[i].candles = data));

    rows.map((row, i) => {
      if (row.oracle === conf.sportOracleAddress) {
        const [championship, yes_team, no_team, date] = row.feed_name.split("_");
        if (championship && yes_team && no_team && date) {
          const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
          const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);

          if (yes_abbreviation) {
            rows[i].yes_crest = `https://crests.football-data.org/${yes_abbreviation[0]}.svg`
          }

          if (no_abbreviation) {
            rows[i].no_crest = `https://crests.football-data.org/${no_abbreviation[0]}.svg`
          }
        }
      }
    });

    await Promise.all(gettersActualData);
    await Promise.all(gettersCandle);
  } catch (e) {
    console.error('error in getters', e)
  }


  if (Object.keys(cacheRate.data).length === 0 || cacheRate.lastUpdate < Date.now() - (1800 * 1000)) {
    try {
      const data = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.values(conf.supported_reserve_assets).map(({ symbol }) => symbol).join(",")}&tsyms=USD`).then(({ data }) => {
        const res = {};

        Object.entries(data).forEach(([name, value]) => {
          const assetBySymbol = Object.entries(conf.supported_reserve_assets).find(([_, { symbol }]) => symbol === name)[0];
          res[assetBySymbol] = value.USD;
        });

        return res;
      });

      cacheRate = {
        data,
        lastUpdate: Date.now()
      }
    } catch (err) {
      console.error(err)
    }
  }

  try {

    const actualMarkets = [];
    const oldMarkets = [];

    const sortedRows = rows.sort((b, a) => ((a.reserve || 0) / (10 ** a.reserve_decimals)) * cacheRate.data[a.reserve_asset] - ((b.reserve || 0) / 10 ** b.reserve_decimals) * cacheRate.data[b.reserve_asset])

    sortedRows.forEach(row => {
      if (now >= row.end_of_trading_period) {
        oldMarkets.push(row);
      } else {
        actualMarkets.push(row);
      }
    });

    reply.send([...actualMarkets, ...oldMarkets]);
  } catch (e) {
    console.error(e)
  }
}