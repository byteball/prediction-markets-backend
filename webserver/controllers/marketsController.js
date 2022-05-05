const { groupBy } = require('lodash');
const moment = require('moment');
const db = require('ocore/db.js');

const marketDB = require('../../db');
const limit = 10;

module.exports = async (request, reply) => {

  let page = request.params.page || 1;

  if (typeof page !== 'number') page = 1;

  const offset = (page - 1) * limit;

  let rows = await db.query(`SELECT * FROM markets_assets LEFT JOIN markets ON markets_assets.aa_address = markets.aa_address LIMIT ${limit} OFFSET ${offset}`);
  const pricesType = rows.length > 10 // TODO: fix it
  const gettersTradeEvents = rows.map((row, i) => marketDB.api.getAllTradeEventsByMarketAddress(row.aa_address).then(data => {
    const sortData = groupBy(data, (row) => moment.unix(row.timestamp).format('MMMM DD YYYY h'))
    rows[i].trade_events = data;
    console.error('sortData', sortData);
  }));

  await Promise.all(gettersTradeEvents);

  reply.send(JSON.stringify(rows));
}