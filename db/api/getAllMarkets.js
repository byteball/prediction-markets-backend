const db = require('ocore/db.js');

exports.getAllMarkets = function () {
  return db.query('SELECT * from markets');
}