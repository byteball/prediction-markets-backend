const db = require("ocore/db");

(async () => {
    await db.query('ALTER TABLE markets ADD base_aa CHAR(32) NOT NULL');

    console.error('done');
})();