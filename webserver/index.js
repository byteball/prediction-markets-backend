const conf = require('ocore/conf.js');
const fastify = require('fastify');
const CORS = require('fastify-cors');
const fastifySensible = require('fastify-sensible');

const marketsController = require('./controllers/marketsController.js');
const reserveAssetsController = require('./controllers/reserveAssetsController.js');
const dailyCandlesController = require('./controllers/dailyCandlesController.js');
const sportCalendarController = require('./controllers/sportCalendarController.js');
const championshipsController = require('./controllers/championshipsController.js');
const sportTeamController = require('./controllers/sportTeamController.js');
const currencyCalendarController = require('./controllers/currencyCalendarController.js');
const popularCurrenciesController = require('./controllers/popularCurrenciesController.js');
const datesController = require('./controllers/datesController.js');
const ogImageController = require('./controllers/ogImageController.js');
const indexController = require('./controllers/indexController.js');
const recentEventsController = require('./controllers/recentEventsController.js');
const firstTradeTimestampController = require('./controllers/firstTradeTimestampController.js');
const bookmakerOddsController = require('./controllers/bookmakerOddsController.js');
const crestController = require('./controllers/crestController.js');
const sitemapController = require('./controllers/sitemapController.js');

// Create instance
const fastifyInstance = fastify({ logger: false });

// CORS
fastifyInstance.register(CORS);

// register error generator
fastifyInstance.register(fastifySensible);

// Declare routes
fastifyInstance.get('/api/markets/:page?', marketsController);
fastifyInstance.get('/api/reserve_assets', reserveAssetsController);
fastifyInstance.get('/api/daily_candles/:address', dailyCandlesController);
fastifyInstance.get('/api/calendar/currency/:currency/:page', currencyCalendarController);
fastifyInstance.get('/api/calendar/:sport/:championship/:page', sportCalendarController);
fastifyInstance.get('/api/championships/:sport?', championshipsController);
fastifyInstance.get('/api/popular_oracle_pairs', popularCurrenciesController);
fastifyInstance.get('/api/team/:sport/:abbreviation', sportTeamController);
fastifyInstance.get('/api/dates/:address', datesController);
fastifyInstance.get('/api/og_images/:type/:address?', ogImageController);
fastifyInstance.get('/api/recent_events/:address/:page?', recentEventsController);
fastifyInstance.get('/api/first_trade_ts/:address', firstTradeTimestampController);
fastifyInstance.get('/api/bookmaker_odds/:sport/:feed_name', bookmakerOddsController);
fastifyInstance.get('/api/crest/:sport/:competitions/:team_id', crestController);
fastifyInstance.get('/api/sitemap.xml', sitemapController);

fastifyInstance.setNotFoundHandler(indexController);

// Run the server
exports.start = async () => {
  try {
    await fastifyInstance.listen(conf.webserverPort);
  } catch (err) {
    fastifyInstance.log.error(err);
    console.error(err)
    process.exit(1);
  }
}