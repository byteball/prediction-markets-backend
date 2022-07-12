const { isInteger } = require("lodash");

const { sportDataService } = require("../../SportData");

module.exports = async (request, reply) => {
  const sportInParams = request.params.sport;
  const pageInParams = request.params.page;

  const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? request.params.page : 1;

  const championship = request.params.championship.replace(/[^a-z0-9]/gi, '');

  reply.send({
    data: sportDataService.getCalendar(sportInParams, championship, page),
    count: sportDataService.getCalendarLength(sportInParams, championship)
  });
}