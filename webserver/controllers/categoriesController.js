const marketDB = require('../../db');

module.exports = async (_, reply) => {
  const categories = await marketDB.api.getAllCategories();

  reply.send(JSON.stringify(categories));
}