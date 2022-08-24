const path = require('path');
const conf = require('ocore/conf.js');
const fs = require("fs").promises;
const moment = require('moment');

const marketDB = require('../../db');
const { generateTextEvent } = require('../../utils/generateTextEvent');
const abbreviations = require('../../abbreviations.json');

const indexPath = path.resolve(__dirname, '..', '..', '..', 'prediction-markets-ui', 'build', 'index.html');

module.exports = async (req, reply) => {
    const htmlData = await fs.readFile(indexPath, 'utf8');

    try {
        const url = req.url || '/';
        const address = url.split("/").find((str) => str.length === 32);
        let imageUrl = '';
        let title = 'Prophet — Decentralized prediction markets';

        if (url.includes('market') && address) {
            imageUrl = `${conf.webUrl}/og_images/market/${address}`;
            const params = await marketDB.api.getMarketParams(address);

            if (params) {
                const state = await marketDB.api.getActualMarketInfo(address);

                let APY;

                if (state) {
                    const elapsed_seconds = (params.committed_at || moment.utc().unix()) - params.created_at;
                    APY = (state.coef || 1) !== 1 ? Math.abs((((state.coef || 1) * (1 - params.issue_fee)) ** (31536000 / elapsed_seconds) - 1) * 100).toFixed(4) : "0";

                    if (APY > 10e9) {
                        APY = '10m.+'
                    } else if (Number(APY) > 9999) {
                        APY = Math.floor(APY).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    } else {
                        APY = Number(APY);
                    }
                }

                const { oracle } = params;

                title = 'Prophet — ';

                let strAPY = '';

                if (APY !== undefined) {
                    strAPY = `, liquidity provider APY ${APY}%`;
                }

                if (oracle === conf.sportOracleAddress) {
                    const [championship, yes_team, no_team, date] = params.feed_name.split("_");

                    const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
                    const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);

                    const yesName = yes_abbreviation[1].name;
                    const noName = no_abbreviation[1].name;
                    title += `${yesName || yes_team} vs ${noName || no_team}${strAPY}`;
                } else {
                    const event = generateTextEvent({ ...params, isUTC: true });

                    title += `${event}${strAPY}`;
                }
            }

        } else if (url.includes('faq')) {
            imageUrl = `${conf.webUrl}/og_images/faq`;
            title = 'Prediction markets — F.A.Q.';
        } else if (url.includes('create')) {
            imageUrl = `${conf.webUrl}/og_images/create`;
            title = 'Prediction markets — Create new market';
        } else {
            const spl = url.split('/');

            if (spl.length === 2 && spl[1]){
                title = `Prophet — ${spl[1]} markets`
            }  else {
                title = 'Prophet — Decentralized prediction markets';
            }
            imageUrl = `${conf.webUrl}/og_images/main`;
            
        }

        // inject meta tags
        modifiedHTMLData = htmlData.replace('__META_OG_IMAGE__', imageUrl);
        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_IMAGE__', imageUrl);


        modifiedHTMLData = modifiedHTMLData.replace(
            "__MAIN_TITLE__",
            title
        )

        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_TITLE__', title);

        reply.headers({
            'Content-Type': 'text/html; charset=UTF-8',
        })

        return reply.send(modifiedHTMLData);
    } catch (e) {
        console.error('error', e)
        return reply.send(htmlData);
    }
}