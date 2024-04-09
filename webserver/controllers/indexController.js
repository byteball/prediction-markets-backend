const path = require('path');
const conf = require('ocore/conf.js');
const fs = require("fs").promises;
const { isValidAddress } = require('ocore/validation_utils');
const { kebabCase } = require('lodash');

const marketDB = require('../../db');
const { generateTextEvent } = require('../../utils/generateTextEvent');
const abbreviations = require('abbreviations');
const { sportDataService } = require("../../SportData");
const { getEstimatedAPY } = require('../../utils/getEstimatedAPY');

const indexPath = path.resolve(__dirname, '..', '..', '..', 'prediction-markets-ui', 'build', 'index.html');
const langs = ['en', 'zh', 'es', 'pt', 'ru', 'uk'];

module.exports = async (req, reply) => {
    const htmlData = await fs.readFile(indexPath, 'utf8');

    try {
        const url = req.url || '/';
        let address = null;

        if (url.includes('market')) {
            const regex = /(\w{32})$/;
            const match = url.match(regex);

            if (match && match.length) {
                address = match[0];
            }
        }

        let imageUrl = '';
        let event = null;

        let title = 'Prophet — Decentralized prediction markets';

        if (url.includes('market') && address && isValidAddress(address)) {

            imageUrl = `${conf.backendUrl}/og_images/market/${address}`;
            const params = await marketDB.api.getMarketParams(address);

            if (params) {
                const state = await marketDB.api.getActualMarketInfo(address);


                let APY;

                if (state) {
                    APY = getEstimatedAPY({ ...params, coef: state.coef }).toFixed(4);

                    if (APY > 10e9) {
                        APY = '10m.+'
                    } else if (Number(APY) > 9999) {
                        APY = Number(APY).toLocaleString('en-US');
                    } else {
                        APY = Number(APY);
                    }
                }

                const { oracle } = params;

                title = 'Prophet prediction markets — ';

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
                    event = generateTextEvent({ ...params, isUTC: true, yes_team_name: yesName, no_team_name: noName });
                } else {
                    event = generateTextEvent({ ...params, isUTC: true });

                    title += `${event}${strAPY}`;
                }
            }

        } else if (url.includes('faq')) {
            imageUrl = `${conf.backendUrl}/og_images/faq`;
            title = 'Prophet prediction markets — F.A.Q.';
        } else if (url.includes('create')) {
            imageUrl = `${conf.backendUrl}/og_images/create`;
            title = 'Prophet prediction markets — Create new market';
        } else {
            const urlParts = url.split('/').filter((path) => !langs.includes(path));

            if (urlParts.length >= 2 && urlParts[1]) {
                let fullChampionship;

                if (urlParts[1] === 'soccer') {
                    const championship = urlParts[2];

                    if (championship) {
                        const championships = sportDataService.getChampionships(urlParts[1]);

                        if (championships) {
                            const championshipItem = championships.find(({ code }) => code === championship);
                            if (championshipItem) {
                                fullChampionship = championshipItem.name;
                            }
                        }
                    }
                }

                if (fullChampionship) {
                    title = `Prophet prediction markets — ${fullChampionship}`;
                } else {
                    const particle = urlParts[1] === 'misc' ? 'miscellaneous' : urlParts[1];
                    title = `Prophet prediction markets — ${particle}`;
                }
            } else {
                title = 'Prophet — Decentralized prediction markets';
            }

            imageUrl = `${conf.backendUrl}/og_images/main`;

        }

        // inject meta tags
        modifiedHTMLData = htmlData.replace('__META_OG_IMAGE__', imageUrl);
        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_IMAGE__', imageUrl);

        if (event) {
            modifiedHTMLData = modifiedHTMLData.replace('__CANONICAL_URL__', `${conf.frontendUrl}/market/${kebabCase(event)}-${address}`);
        } else {
            modifiedHTMLData = modifiedHTMLData.replace('<link rel="canonical" href="__CANONICAL_URL__" data-react-helmet="true"/>', '');
        }

        modifiedHTMLData = modifiedHTMLData.replace(
            "__MAIN_TITLE__",
            title
        )

        modifiedHTMLData = modifiedHTMLData.replace('__META_OG_TITLE__', title);

        reply.headers({
            'Content-Type': 'text/html; charset=UTF-8',
        })

        // ALTERNATE_LINKS: https://developers.google.com/search/docs/specialty/international/localized-versions?hl=ru#example
    
        const cleanUrlPath = url.split('/').filter((path) => !langs.includes(path)).join('/');

        modifiedHTMLData = modifiedHTMLData.replace('__ALTERNATE_LINKS__', `
            <link rel="alternate" hreflang="x-default" href="${conf.frontendUrl}${cleanUrlPath}" />
            ${langs.filter(lng => lng !== 'en').map((lang)=> `<link rel="alternate" hreflang=${lang} href="${conf.frontendUrl}/${lang}${cleanUrlPath}" />`).join("\n")}
        `);

        return reply.send(modifiedHTMLData);
    } catch (e) {
        console.error('error', e)
        return reply.send(htmlData);
    }
}