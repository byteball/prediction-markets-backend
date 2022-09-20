const db = require('ocore/db.js');

exports.getBookmakerOddsByFeedName = async function (feed_name) {
    const markets = await db.query('SELECT yes_odds, no_odds, draw_odds FROM bookmaker_odds WHERE feed_name = ?', [feed_name]);
    return markets[0];
}