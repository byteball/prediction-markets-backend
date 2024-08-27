
const db = require('ocore/db.js');
const moment = require('moment');
const { soccerCompetitions } = require('abbreviations/soccerCompetitions');
const { getVenueFromSportData } = require('../../utils/getVenueFromSportData');
const { getVenueFromTheScore } = require('../../utils/getVenueFromTheScore');

exports.saveMarketVenue = async function (feed_name, event_date) {
    const { sportDataService } = require('../../SportData');

    const championship = feed_name.split('_')[0];
    const championshipCodes = soccerCompetitions.map(c => sportDataService.getChampionshipBySoccerCompetitionId(c)).filter(c => c);

    if (!championshipCodes.includes(championship)) return;

    let venue = await getVenueFromTheScore(feed_name);

    if (!venue) {
        const event_date_ts = moment.utc(event_date, 'YYYY-MM-DDTHH:mm:ss').utc().unix();
        venue = await getVenueFromSportData(feed_name, event_date_ts);
    }

    if (!venue) {
        const matches = sportDataService.calendar.soccer;

        if (matches.length) {
            const match = matches.find(({ feed_name: fn }) => fn === feed_name);

            if (match) {
                venue = match.venue
            }
        }
        console.error('log(venue): use football data service', feed_name);
    }

    if (venue) {
        await db.query(`INSERT INTO sport_market_venues (venue, feed_name) VALUES (?, ?)`, [venue, feed_name]);

        console.error(`Venue ${venue} for feed ${feed_name} on ${moment.utc(event_date).format('YYYY-MM-DDTHH:mm:ss')} saved`);
    }
}
