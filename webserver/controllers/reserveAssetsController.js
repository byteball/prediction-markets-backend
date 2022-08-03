const conf = require('ocore/conf.js');

module.exports = async (_, reply) => {
  reply.send(conf.supportedReserveAssets);
}