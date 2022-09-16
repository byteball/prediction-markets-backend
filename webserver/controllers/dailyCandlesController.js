const { isValidAddress } = require('ocore/validation_utils');
const moment = require('moment');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address || !isValidAddress(aa_address)) return reply.badRequest();

  try {
    // use hourly candles if 7 days from creation have not passed
    const params = await marketDB.api.getMarketParams(aa_address);

    if (!params) return reply.notFound();

    const now = moment.utc().unix();
    const first_trade_ts = await marketDB.api.getTradeEventsByMarket(aa_address, { limit: 1, sort: 'ASC' }).then(({ data: first_trade_ts }) => first_trade_ts?.[0]?.timestamp || null).catch(console.error);

    const monthAlreadyPassed = (params.committed_at || now) > ((first_trade_ts || params.created_at) + 3600 * 24 * 30);

    const candles = await marketDB.api.getCandles({ aa_address, type: monthAlreadyPassed ? "daily" : 'hourly', limit: monthAlreadyPassed ? 365 : 24 * 30, params });

    return reply.send(candles);
  } catch (e) {
    console.error('error in candles controller', e)
    return reply.internalServerError();
  }
}

