const db = require('ocore/db');
const createDB = require('./createDB');

(async () => {
	await db.query("DROP TABLE categories");
	await db.query("DROP TABLE trades");
	await db.query("DROP TABLE market_categories");
	await createDB.create();
	console.log('done');
	
	process.exit();
})();