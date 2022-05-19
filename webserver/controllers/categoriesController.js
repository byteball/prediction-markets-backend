const marketDB = require('../../db');

module.exports = async (_, reply) => {
  try {
    const categories = await marketDB.api.getAllCategories();
    return reply.send(categories);
  } catch {
    return reply.internalServerError();
  }
}