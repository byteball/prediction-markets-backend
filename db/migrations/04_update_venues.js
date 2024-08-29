const db = require("ocore/db");
const moment = require("moment");

const { saveMarketVenue } = require("../api");

(async () => {
    const markets = await db.query('SELECT * FROM markets LEFT JOIN sport_market_venues USING (feed_name)');

    for (const market of markets) {
        try {
            const eventDate = moment.unix(market.event_date).format('YYYY-MM-DDTHH:mm:ss');
            await saveMarketVenue(market.feed_name, eventDate, market.venue);
        } catch (e) {
            console.error('error(saveMarketVenue)', e);
        }
    }

    console.error('done');
})();
