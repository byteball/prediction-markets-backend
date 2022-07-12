const db = require('ocore/db.js');

const filter = ({oracle}) => {
  if (oracle) {
    return `WHERE oracle='${oracle}';`
  } else {
    return '';
  }
}

exports.getAllMarkets = function (oracle) {
  return db.query(`SELECT * from markets ${filter({ oracle })}`);
}