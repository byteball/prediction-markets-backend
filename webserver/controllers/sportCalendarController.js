const { footballDataService } = require("../../FootballData");

module.exports = async (_, reply) => {
  reply.send(footballDataService.getCalendar());
}