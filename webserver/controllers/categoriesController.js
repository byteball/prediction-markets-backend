const marketDB = require('../../db');

module.exports = async (request, reply) => {
  const categories = await marketDB.api.getAllCategories();

  reply.send(JSON.stringify(categories));
}