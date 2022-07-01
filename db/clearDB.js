const db = require('ocore/db');
const createDB = require('./createDB');

(async () => {
	await db.query("DROP TABLE markets");
	await db.query("DROP TABLE categories");
	await db.query("DROP TABLE trades");
	await db.query("DROP TABLE market_assets");
	await db.query("DROP TABLE trades");
	await db.query("DROP TABLE hourly_closes");
	await db.query("DROP TABLE daily_closes");
	await db.query("DROP TRIGGER update_reserve_total");
	
	await createDB.create(); 
	console.log('done');
	
	process.exit();
})();