const { sportDataService } = require("../../SportData");

module.exports = async (request, reply) => {
  try {
    const sportInParams = request.params.sport;
    const championshipInParams = request.params.championship || null;

    if (championship && sportInParams) {
      return sportDataService.getChampionshipInfo(sportInParams, championship);
    } else {
      return reply.send(sportDataService.getChampionships(sportInParams));
    }

  } catch {
    return reply.internalServerError();
  }
}