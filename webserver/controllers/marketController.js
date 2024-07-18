const { isValidAddress } = require('ocore/validation_utils');
const abbreviations = require('abbreviations');
const conf = require('ocore/conf.js');
const { kebabCase } = require('lodash');

const marketDB = require('../../db');
const { generateTextEvent } = require('../../utils/generateTextEvent');

module.exports = async (request, reply) => {
    const address = request.params.address;

    if (isValidAddress(address)) {
        try {
            const market = await marketDB.api.getMarketParams(address);
            if (!market) return reply.notFound();

            let yes_team_name, no_team_name;

            if (conf.sportOracleAddress === market.oracle) {
                const [_, yes_team, no_team] = market.feed_name.split("_");
                const yes_abbreviation = Object.entries(abbreviations.soccer).find(([_, item]) => item.abbreviation === yes_team);
                const no_abbreviation = Object.entries(abbreviations.soccer).find(([_, item]) => item.abbreviation === no_team);

                if (yes_abbreviation && no_abbreviation) {
                    yes_team_name = yes_abbreviation[1].name;
                    no_team_name = no_abbreviation[1].name;
                }
            }

            const eventText = generateTextEvent({ ...market, yes_team_name, no_team_name, languageKey: 'en', isUTC: true });
            const seoText = kebabCase(eventText);

            const marketUrl = `${conf.frontendUrl}/market/${seoText}-${address}`;

            reply.send({ ...market, eventText, marketUrl });
        } catch (e) {
            console.error('marketController error', e);
        }

    } else {
        reply.badRequest();
    }
}
