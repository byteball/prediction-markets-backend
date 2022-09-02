const { isInteger } = require('lodash');
const conf = require('ocore/conf.js');
const { isValidAddress } = require('ocore/validation_utils');

const marketDB = require('../../db');

module.exports = async (request, reply) => {
    try {
        const address = request.params.address;
        const pageInParams = request.params.page;
        const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? pageInParams : 1;

        if (!isValidAddress(address)) return reply.badRequest();

        const limit = conf.limitEventsOnPage;
        const offset = (page - 1) * limit;

        const { data, count } = await marketDB.api.getTradeEventsByMarket(address, { limit, offset, getCount: true });

        reply.send({ data, count });
    } catch (e) {
        console.error(e)
    }
}