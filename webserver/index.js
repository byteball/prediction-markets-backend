const conf = require('ocore/conf.js');
const fastify = require('fastify');
const CORS = require('fastify-cors');
const fastifySensible = require('fastify-sensible');

const marketsController = require('./controllers/marketsController.js');
const categoriesController = require('./controllers/categoriesController.js');
const reserveAssetsController = require('./controllers/reserveAssetsController.js');
const dailyCandlesController = require('./controllers/dailyCandlesController.js');
const marketCategoryController = require('./controllers/marketCategoryController.js');

// Create instance
const fastifyInstance = fastify({ logger: false });

// CORS
fastifyInstance.register(CORS);

// register error generator
fastifyInstance.register(fastifySensible);

// Declare routes
fastifyInstance.get('/markets/:page', marketsController);
fastifyInstance.get('/markets', marketsController);
fastifyInstance.get('/categories', categoriesController);
fastifyInstance.get('/reserve_assets', reserveAssetsController);
fastifyInstance.get('/daily_candles/:address', dailyCandlesController);
fastifyInstance.get('/category/:address', marketCategoryController);

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