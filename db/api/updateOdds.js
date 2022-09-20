const db = require('ocore/db.js');
const moment = require('moment');

exports.updateOdds = async function (data) {
    const now = moment.utc().unix();

    for (feed_name in data) {
        const { yes_odds, no_odds, draw_odds } = data[feed_name];

        if (yes_odds !== null && no_odds !== null && draw_odds !== null) {
            await db.query(`REPLACE INTO bookmaker_odds (feed_name, yes_odds, no_odds, draw_odds, odds_updated_at) VALUES (?, ?, ?, ?, ?)`, [
                feed_name,
                yes_odds,
                no_odds,
                draw_odds,
                now
            ]);
        }
    }
}