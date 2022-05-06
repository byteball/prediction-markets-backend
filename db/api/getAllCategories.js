const db = require('ocore/db.js');

exports.getAllCategories = async function () {
  return await db.query('SELECT category from categories').then((rows) => rows.map((row) => row.category));
}