const conf = require('ocore/conf.js');

module.exports = async (request, reply) => {
  reply.send(JSON.stringify(conf.supported_reserve_assets));
}