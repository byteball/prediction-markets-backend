const { sportDataService } = require("../../SportData");

module.exports = async (_, reply) => {
  reply.send(sportDataService.getCalendar());
}