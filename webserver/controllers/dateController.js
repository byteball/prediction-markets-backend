const { isValidAddress } = require('ocore/validation_utils');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
    const address = request.params.address;

    if (!isValidAddress(address)) return reply.badRequest();

    const params = await marketDB.api.getMarketParams(address);

    if (params) {
        return reply.send({
            created_at: params.created_at,
            committed_at: params.committed_at
        });
    } else {
        return reply.notFound();
    }

}