const { sportDataService } = require("../../SportData");

module.exports = async (request, reply) => {
  try {
    const sportInParams = request.params.sport;
    return reply.send(sportDataService.getChampionships(sportInParams));
  } catch {
    return reply.internalServerError();
  }
}