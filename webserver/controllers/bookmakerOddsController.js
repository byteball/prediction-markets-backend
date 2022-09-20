const { sportDataService } = require("../../SportData");

module.exports = async (request, reply) => {
    const sportInParams = request.params.sport;
    const feed_name = request.params.feed_name;
    
    const odds = await sportDataService.getOdds(sportInParams, feed_name);

    return reply.send(odds || null);
}