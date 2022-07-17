const db = require('ocore/db.js');

exports.create = async function () {
	console.error("will create tables if not exist");

	await db.query(`CREATE TABLE IF NOT EXISTS trades (
		aa_address CHAR(32) NOT NULL,
		response_unit CHAR(44) PRIMARY KEY NOT NULL,
		yes_amount INTEGER DEFAULT 0,
		no_amount INTEGER DEFAULT 0,
		draw_amount INTEGER DEFAULT 0,
		supply_yes INTEGER DEFAULT 0,
		supply_no INTEGER DEFAULT 0,
		supply_draw INTEGER DEFAULT 0,
		yes_price REAL DEFAULT 1,
		no_price REAL DEFAULT 1,
		draw_price REAL DEFAULT 1,
		reserve INTEGER DEFAULT 0,
		coef REAL DEFAULT 1,
		type VARCHAR(40),
		timestamp TIMESTAMP NOT NULL,
		UNIQUE (response_unit)
	)`);
	
	await db.query(`CREATE TABLE IF NOT EXISTS markets (
		aa_address CHAR(32) NOT NULL,
		oracle CHAR(32) NOT NULL,
		comparison CHAR(2) NOT NULL,
		feed_name CHAR(32) NOT NULL,
		reserve_asset CHAR(44) NOT NULL,
		allow_draw BOOLEAN NOT NULL,
		datafeed_value CHAR(128) NOT NULL,
		datafeed_draw_value CHAR(128),
		event_date INT NOT NULL,
		quiet_period INTEGER DEFAULT 0,
		waiting_period_length INT NOT NULL,
		issue_fee REAL DEFAULT 0.01,
		redeem_fee REAL DEFAULT 0.02,
		arb_profit_tax REAL DEFAULT 0.9,
		total_reserve INTEGER DEFAULT 0,
		result CHAR(4),
		timestamp TIMESTAMP NOT NULL,
		UNIQUE (aa_address)
	)`);

	await db.query(`CREATE TABLE IF NOT EXISTS market_assets (
		aa_address CHAR(32),
		yes_asset CHAR(44),
		no_asset CHAR(44),
		reserve_asset CHAR(44),
		draw_asset CHAR(44),
		yes_symbol CHAR(44),
		no_symbol CHAR(44),
		draw_symbol CHAR(44),
		yes_decimals INTEGER DEFAULT 0,
		no_decimals INTEGER DEFAULT 0,
		draw_decimals INTEGER DEFAULT 0,
		reserve_symbol CHAR(44),
		reserve_decimals INTEGER DEFAULT 0,
		FOREIGN KEY(aa_address) REFERENCES markets(aa_address),
		UNIQUE (aa_address)
	)`);

	await db.query(`CREATE TABLE IF NOT EXISTS hourly_closes (
		aa_address CHAR(32) NOT NULL,
		yes_price REAL DEFAULT 0,
		no_price REAL DEFAULT 0,
		draw_price REAL DEFAULT 0,
		supply_yes INTEGER DEFAULT 0,
		supply_no INTEGER DEFAULT 0,
		supply_draw INTEGER DEFAULT 0,
		coef REAL DEFAULT 1,
		reserve INTEGER DEFAULT 0,
		reserve_to_usd_rate REAL,
		start_timestamp TIMESTAMP NOT NULL,
		UNIQUE (aa_address, start_timestamp)
	)`);

	await db.query(`CREATE TABLE IF NOT EXISTS daily_closes (
		aa_address CHAR(32) NOT NULL,
		yes_price REAL DEFAULT 0,
		no_price REAL DEFAULT 0,
		draw_price REAL DEFAULT 0,
		supply_yes INTEGER DEFAULT 0,
		supply_no INTEGER DEFAULT 0,
		supply_draw INTEGER DEFAULT 0,
		coef REAL DEFAULT 1,
		reserve INTEGER DEFAULT 0,
		reserve_to_usd_rate REAL,
		start_timestamp TIMESTAMP NOT NULL,
		FOREIGN KEY(aa_address) REFERENCES markets(aa_address),
		UNIQUE (aa_address, start_timestamp)
	)`);

	await db.query(`CREATE TRIGGER IF NOT EXISTS update_reserve_total AFTER INSERT ON trades
		BEGIN
			UPDATE markets SET total_reserve=new.reserve WHERE aa_address = new.aa_address;
		END;
	`)

	await db.query('CREATE UNIQUE INDEX IF NOT EXISTS index_assets on market_assets (yes_asset, no_asset, draw_asset);')

	console.error('db installed');
}