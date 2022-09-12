const { isValidAddress } = require('ocore/validation_utils');

const marketDB = require('../../db');

module.exports = async (request, reply) => {
    const aa_address = request.params.address;

    if (!aa_address || !isValidAddress(aa_address)) return reply.badRequest();

    try {
        const first_trade_ts = await marketDB.api.getTradeEventsByMarket(aa_address, { limit: 1, sort: 'ASC' }).then(({ data }) => data?.[0]?.timestamp || null).catch(console.error);

        reply.send(first_trade_ts);
    } catch (e)  {
        console.error('first trade ts controller error', e)
        return reply.internalServerError();
    }
}