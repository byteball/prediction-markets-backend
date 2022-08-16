const db = require("ocore/db");

(async () => {
    await db.query('ALTER TABLE markets ADD committed_at TIMESTAMP');

    console.error('done');
})();