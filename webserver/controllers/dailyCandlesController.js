const { isValidAddress } = require('ocore/validation_utils');
const moment = require('moment');
const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address || !isValidAddress(aa_address)) return reply.badRequest();

  try {
    // use hourly candles if 7 days from creation have not passed
    const params = await marketDB.api.getMarketParams(aa_address);
    const now = moment.utc().unix();
    const sevenDaysAlreadyPassed = now > (params.end_of_trading_period + 3600 * 24 * 7);

    const candles = await marketDB.api.getCandles({ aa_address, type: sevenDaysAlreadyPassed ? "daily" : 'hourly', limit: !sevenDaysAlreadyPassed ? 3600 * 24 * 7 : undefined });

    return reply.send(candles);
  } catch (e) {
    return reply.internalServerError();
  }
}

