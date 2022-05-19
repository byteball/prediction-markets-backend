const db = require('ocore/db');
const createDB = require('./createDB');

(async () => {
	await db.query("DROP TABLE markets");
	await db.query("DROP TABLE categories");
	await db.query("DROP TABLE trades");
	await db.query("DROP TABLE markets_assets");
	await db.query("DROP TABLE trade_events");
	await db.query("DROP TABLE hourly_candles");
	await db.query("DROP TABLE daily_candles");
	await db.query("DROP TRIGGER update_reserve_total");
	
	await createDB.create(); 
	console.log('done');
	
	process.exit();
})();