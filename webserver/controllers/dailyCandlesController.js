const { isValidAddress } = require('ocore/validation_utils');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address || !isValidAddress(aa_address)) return reply.badRequest();

  try {
    const candles = await marketDB.api.getCandles(aa_address, "daily");

    return reply.send(candles);
  } catch (e) {
    return reply.internalServerError();
  }
}

