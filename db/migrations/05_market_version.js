const db = require("ocore/db");

(async () => {
    await db.query('ALTER TABLE markets ADD version INTEGER NOT NULL DEFAULT 1');
    await db.query('ALTER TABLE markets ADD is_tokenless BOOLEAN NOT NULL DEFAULT 0');

    console.error('done');
})();
