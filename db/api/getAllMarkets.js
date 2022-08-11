const db = require('ocore/db.js');
const moment = require('moment');

const filter = ({ oracles, waitingResult }) => {
  let whereAlreadyAdded = false;
  let query = ''
  if (oracles) {
    query += `WHERE markets.oracle IN (${"'" + oracles.join("','") + "'"})`
    whereAlreadyAdded = true;
  }

  if (waitingResult) {
    const now = moment.utc().unix();
    query += ` ${whereAlreadyAdded ? 'AND' : 'WHERE'} markets.result IS NULL AND markets.event_date < ${now}`
  }

  return query;
}

exports.getAllMarkets = function (queryFilters = {}) {
  return db.query(`SELECT * FROM markets ${filter(queryFilters)}`);
}