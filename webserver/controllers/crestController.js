const { sportDataService } = require("../../SportData");

module.exports = async (request, reply) => {
  const sportInParams = request.params.sport;
  const competitionsInParams = request.params.competitions;
  const teamIdInParams = request.params.team_id;

  if (!sportInParams || !competitionsInParams || !teamIdInParams) return reply.badRequest();

  const crestUrl = sportDataService.getCrest(sportInParams, competitionsInParams, teamIdInParams);

  reply.send(crestUrl)
}