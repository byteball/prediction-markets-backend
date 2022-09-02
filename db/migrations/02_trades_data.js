const db = require("ocore/db");

(async () => {
    await db.query('ALTER TABLE trades ADD reserve_amount INTEGER DEFAULT 0, trigger_address CHAR(32) NOT NULL, trigger_unit CHAR(44)');

    console.error('done');
})();