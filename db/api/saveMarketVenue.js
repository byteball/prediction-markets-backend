
const db = require('ocore/db.js');
const moment = require('moment');
const { soccerCompetitions } = require('abbreviations/soccerCompetitions');

exports.saveMarketVenue = async function (feed_name, event_date) {
    const { sportDataService } = require('../../SportData');

    const championship = feed_name.split('_')[0];
    const championshipCodes = soccerCompetitions.map(c => sportDataService.getChampionshipBySoccerCompetitionId(c)).filter(c => c);

    if (!championshipCodes.includes(championship)) return;

    const matches = sportDataService.calendar.soccer;

    if (matches.length) {
        const match = matches.find(({ feed_name: fn }) => fn === feed_name);

        if (match) {
            const venue = match.venue;

            await db.query(`INSERT INTO sport_market_venues (venue, feed_name, event_date) VALUES (?, ?, ?)`, [venue, feed_name, event_date]);

            console.error(`Venue ${venue} for feed ${feed_name} on ${moment.utc(event_date).format('YYYY-MM-DDTHH:mm:ss')} saved`);
        }
    }
}
