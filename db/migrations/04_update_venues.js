const db = require("ocore/db");
const { saveMarketVenue } = require("../api");

(async () => {
    const markets = await db.query('SELECT * FROM markets LEFT JOIN sport_market_venues USING (feed_name)');

    for (const market of markets) {
        try {
            await saveMarketVenue(market.feed_name, market.event_date, market.venue);
        } catch (e) {
            console.error('error(saveMarketVenue)', e);
        }
    }

    console.error('done');
})();
