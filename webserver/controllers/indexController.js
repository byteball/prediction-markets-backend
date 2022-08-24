const path = require('path');
const conf = require('ocore/conf.js');
const fs = require("fs").promises;
const marketDB = require('../../db');
const { generateTextEvent } = require('../../utils/generateTextEvent');
const abbreviations = require('../../abbreviations.json');

const indexPath = path.resolve(__dirname, '..', '..', '..', 'prediction-markets-ui', 'build', 'index.html');

module.exports = async (req, reply) => {
    const htmlData = await fs.readFile(indexPath, 'utf8');

    try {
        const url = req.url || '/';
        const address = url.split("/").find((str) => str.length === 32);
        const host = conf.webUrl;
        let imageUrl = '';
        let title = 'Prophet — Decentralized prediction markets';

        if (url.includes('market') && address) {
            imageUrl = `${conf.webUrl}/og_images/market/${address}`;
            const params = await marketDB.api.getMarketParams(address);

            if (params) {
                const { oracle } = params;
                title = 'Prophet — ';

                if (oracle === conf.sportOracleAddress) {
                    const [championship, yes_team, no_team, date] = row.feed_name.split("_");

                    const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
                    const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);

                    const yesName = yes_abbreviation[1].name;
                    const noName = no_abbreviation[1].name;

                    title += `${yesName || yes_team} vs ${noName || no_team}`;
                } else {
                    const event = generateTextEvent({ ...params, isUTC: true });

                    title += event;
                }
            }

        } else if (url.includes('faq')) {
            imageUrl = `${conf.webUrl}/og_images/faq`;
            title = 'Prediction markets — F.A.Q.';
        } else if (url.includes('create')) {
            imageUrl = `${conf.webUrl}/og_images/create`;
            title = 'Prediction markets — Create new market';
        } else {
            imageUrl = `${conf.webUrl}/og_images/main`;
            title = 'Prophet — Decentralized prediction markets';
        }

        // inject meta tags
        modifiedHTMLData = htmlData.replace('__META_OG_IMAGE__', imageUrl);
        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_IMAGE__', imageUrl);


        modifiedHTMLData = modifiedHTMLData.replace(
            "<title>Prophet — Decentralized prediction markets</title>",
            `<title>${title}</title>`
        )

        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_TITLE__', title);

        reply.headers({
            'Content-Type': 'text/html; charset=UTF-8',
        })
        
        return reply.send(modifiedHTMLData);
    } catch (e) {
        console.error('error', e)
    }
}