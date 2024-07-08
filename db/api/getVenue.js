const db = require('ocore/db.js');

exports.getVenue = async function (feed_name) {
    return await db.query('SELECT venue from sport_market_venues WHERE feed_name=?', [feed_name]).then(data => data[0]?.venue);
}
