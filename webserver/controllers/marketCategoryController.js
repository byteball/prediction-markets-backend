const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const aa_address = request.params.address;

  if (!aa_address) return 'ERROR' // TODO: Исправить используя библиотеку компонентов

  let category;

  try {
    category = await marketDB.api.getCategoryByAddress(aa_address);
  } catch (e) {
    console.error('error', e)
  }

  reply.send(category);
}