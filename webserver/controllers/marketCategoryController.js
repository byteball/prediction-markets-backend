const { isValidAddress } = require('ocore/validation_utils');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address || !isValidAddress(aa_address)) return reply.badRequest();

  try {
    const category = await marketDB.api.getCategoryByAddress(aa_address);
    reply.send(category);
  } catch (e) {
    reply.internalServerError();
  }
}