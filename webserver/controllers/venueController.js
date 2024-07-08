const marketDB = require('../../db');

module.exports = async (request, reply) => {
    const feed_name = String(request.params.feed_name);

    if (feed_name) {
        const venue = await marketDB.api.getVenue(feed_name);

        if (venue) {
            return reply.send({ data: venue });
        } else {
            return reply.notFound();
        }
    } else {
        return reply.badRequest();
    }
}
