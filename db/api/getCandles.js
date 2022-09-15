const moment = require('moment');
const db = require('ocore/db.js');
const { getTradeEventsByMarket } = require('./getTradeEventsByMarket');

exports.getCandles = async function ({ aa_address, type, onlyYesPrices = false, limit: customLimit, params }) {
  if (type !== 'daily' && type !== 'hourly') throw 'unknown type';

  const first_trade_ts = await getTradeEventsByMarket(aa_address, { limit: 1, sort: 'ASC' }).then(({ data: first_trade_ts }) => first_trade_ts?.[0]?.timestamp || null).catch(console.error);

  let limit = customLimit ? customLimit : type === 'hourly' ? 24 : 30 * 6;
  const step_length = type === 'hourly' ? 3600 : 24 * 3600; // hour in seconds OR day in seconds

  let end = params.committed_at ? moment.unix(params.committed_at) : moment.utc();

  end = end.startOf(type === 'hourly' ? "hour" : 'day').add(1, type === 'hourly' ? "h" : 'd').unix();

  let start = end - step_length * limit;

  // 1st step: select all candles in period
  let rows = await db.query(`SELECT * FROM ${type}_candles WHERE aa_address=? AND start_timestamp >= ? ORDER BY start_timestamp DESC LIMIT ${limit}`, [aa_address, start]);

  if (onlyYesPrices) {
    if (rows.length < 2 || rows[0].yes_price === rows[rows.length - 1].yes_price) {
      limit *= 3;
      start = end - step_length * limit;
      rows = await db.query(`SELECT * FROM ${type}_candles WHERE aa_address=? AND start_timestamp >= ? ORDER BY start_timestamp DESC LIMIT ${limit}`, [aa_address, start]);
    }

    if (rows.length < 2 || rows[0].yes_price === rows[rows.length - 1].yes_price) {
      limit *= 3;
      start = end - step_length * limit;
      rows = await db.query(`SELECT * FROM ${type}_candles WHERE aa_address=? AND start_timestamp >= ? ORDER BY start_timestamp DESC LIMIT ${limit}`, [aa_address, start]);
    }
  }

  // 2nd step: If there was no trading for the selected period, then we look for the most recent trading event and take its date
  if (!rows[0]) {
    rows = await db.query(`SELECT * FROM ${type}_candles WHERE aa_address=? ORDER BY start_timestamp DESC LIMIT 1`, [aa_address]);

    // If the market has no trading events return empty array
    if (!rows[0]) return []

    rows[0].start_timestamp = start;
  } else if (rows[0].start_timestamp !== start) { // 3rd step: Find the first element, if there was one before
    const [lastRow] = await db.query(`SELECT * FROM ${type}_candles WHERE aa_address=? AND start_timestamp < ? ORDER BY start_timestamp DESC LIMIT 1`, [aa_address, start]);

    if (lastRow) {
      lastRow.start_timestamp = start;
      rows = [...rows, lastRow];
    } else {
      start = rows[rows.length - 1].start_timestamp;
    }
  }

  let currentRowIndex = 0;
  const data = [];

  // 4th step: fill empty candles
  rows = rows.reverse();

  for (let currentTs = start; currentTs < end; currentTs += step_length) {
    if (rows[currentRowIndex] && rows[currentRowIndex].start_timestamp === currentTs) {
      // we have a candle with this timestamp
      data.push({ ...rows[currentRowIndex], start_timestamp: currentTs });
      currentRowIndex++;
    } else {
      // we don't have a candle with this timestamp, so we have to take the last one
      data.push({ ...rows[currentRowIndex - 1], start_timestamp: currentTs });
    }
  }

  if (data.length && type === 'hourly') {
    data[0].start_timestamp = first_trade_ts;
  }

  if (onlyYesPrices) {
    return data.map(({ open_yes_price, start_timestamp }) => ({ price: open_yes_price, timestamp: start_timestamp }));
  } else {
    return data;
  }
}