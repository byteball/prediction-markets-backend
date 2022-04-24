const db = require('ocore/db.js');

exports.create = async function () {
  console.log("will create tables if not exist");

  await db.query(`CREATE TABLE IF NOT EXISTS categories (
		category_id INTEGER PRIMARY KEY,
		name VARCHAR(20) NOT NULL,
		UNIQUE (name)
	)`);

  await db.query(`CREATE TABLE IF NOT EXISTS trades (
		aa_address CHAR(32) NOT NULL,
		response_unit CHAR(44) PRIMARY KEY NOT NULL,
    yes_amount INTEGER DEFAULT 0,
    no_amount INTEGER DEFAULT 0,
    draw_amount INTEGER DEFAULT 0,
    supply_yes INTEGER DEFAULT 0,
    supply_no INTEGER DEFAULT 0,
    supply_draw INTEGER DEFAULT 0,
		coef REAL DEFAULT 1,
		type VARCHAR(40),
		timestamp TIMESTAMP NOT NULL,
		UNIQUE (response_unit)
	)`);

  await db.query(`CREATE TABLE IF NOT EXISTS market_categories (
		category_id INTEGER NOT NULL,
    aa_address CHAR(32) NOT NULL,
		FOREIGN KEY(category_id) REFERENCES categories(category_id),
		UNIQUE (aa_address)
	)`);

}