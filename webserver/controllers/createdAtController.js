const { isValidAddress } = require('ocore/validation_utils');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
    const address = request.params.address;

    if (!isValidAddress(address)) return reply.badRequest();

    const ts = await marketDB.api.getMarketParams(address).then((data) => data && data.created_at);

    if (ts) {
        return reply.send(ts);
    } else {
        return reply.notFound();
    }

}