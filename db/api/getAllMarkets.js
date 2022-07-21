const db = require('ocore/db.js');
const conf = require('ocore/conf.js');

const filter = ({ oracles }) => {
  if (oracles) {
    return `WHERE markets.oracle == '${conf.currencyOracleAddresses[0]}' ${conf.currencyOracleAddresses.slice(1, conf.currencyOracleAddresses.length).map((oracle) => `OR markets.oracle == '${oracle}'`)}`
  } else {
    return '';
  }
}

exports.getAllMarkets = function (oracles) {
  return db.query(`SELECT * from markets ${filter({ oracles })}`);
}