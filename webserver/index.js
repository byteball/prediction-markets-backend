const conf = require('ocore/conf.js');
const fastify = require('fastify');
const CORS = require('fastify-cors');
const fastifySensible = require('fastify-sensible');

const marketsController = require('./controllers/marketsController.js');

// Create instance
const fastifyInstance = fastify({ logger: false });

// CORS
fastifyInstance.register(CORS);

// register error generator
fastifyInstance.register(fastifySensible);

// Declare routes
fastifyInstance.get('/markets/:page', marketsController);
fastifyInstance.get('/markets', marketsController);

// Run the server
exports.start = async () => {
  try {
    await fastifyInstance.listen(3005);
  } catch (err) {
    fastifyInstance.log.error(err);
    process.exit(1);
  }
}