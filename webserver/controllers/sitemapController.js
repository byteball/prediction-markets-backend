const conf = require('ocore/conf.js');
const { kebabCase } = require('lodash');
const { SitemapStream, streamToPromise } = require('sitemap');

const abbreviations = require('abbreviations');

const { sportDataService } = require('../../SportData');

const { getAllMarkets } = require('../../db/api');
const { generateTextEvent } = require('../../utils/generateTextEvent');

const langs = [
    "en",
    "zh",
    "es",
    "pt",
    "ru",
    "uk" // Ukrainian
];

module.exports = async (_, reply) => {

    try {
        // Creates a sitemap object given the input configuration with URLs
        const smStream = new SitemapStream({ hostname: 'https://prophet.ooo' });

        const championships = await sportDataService.getChampionships();

        const markets = await getAllMarkets();

        langs.forEach((lng) => {
            smStream.write({ url: `/${lng === "en" ? "" : lng}`, changefreq: 'daily', priority: 1 });
            smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/create`, changefreq: 'monthly', priority: 0.5 });
            smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/faq`, changefreq: 'monthly', priority: 1 });
            smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/currency`, changefreq: 'daily', priority: 1 });
            smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/misc`, changefreq: 'monthly', priority: 1 });

            Object.keys(championships).forEach((sport) => {
                championships[sport].forEach((championship) => {
                    if (championship.code) {
                        smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/${sport}/${championship.code}`, changefreq: 'monthly', priority: 1 });
                    }
                });
            });

            markets.forEach((params) => {
                let yes_team_name, no_team_name;

                if (params.oracle === conf.sportOracleAddress) {
                    const [_, yes_team, no_team, __] = params.feed_name.split("_");

                    const yes_abbreviation = Object.entries(abbreviations.soccer).find(([_, item]) => item.abbreviation === yes_team);
                    const no_abbreviation = Object.entries(abbreviations.soccer).find(([_, item]) => item.abbreviation === no_team);

                    yes_team_name = yes_abbreviation[1].name || yes_team;
                    no_team_name = no_abbreviation[1].name || no_team;
                }

                const event = generateTextEvent({ ...params, isUTC: true, yes_team_name, no_team_name });

                smStream.write({ url: `${lng === "en" ? "" : `/${lng}`}/market/${kebabCase(event)}-${params.aa_address}`, changefreq: 'monthly', priority: 1 });
            });
        });

        smStream.end();

        const result = await streamToPromise(smStream);
        
        reply.header('Content-Type', 'application/xml');
        reply.send(result);
    } catch (e) {
        console.error('sitemap.xml error', e);
        return reply.internalServerError();
    }
}