const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address) return 'ERROR' // TODO: Исправить используя библиотеку компонентов

  let candles;

  try {
    candles = await marketDB.api.getCandles(aa_address, "daily");
  } catch (e) {
    console.error('get daily candles error', e);
  }

  reply.send(JSON.stringify(candles));
}

