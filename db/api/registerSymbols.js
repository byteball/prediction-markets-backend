const { dag } = require('aabot');
const moment = require('moment');
const token_registry = require('aabot/token_registry.js');
const conf = require('ocore/conf.js');

const abbreviations = require('../../abbreviations.json');
const { generateTextEvent } = require('../../utils/generateTextEvent');
const operator = require('aabot/operator.js');

const registeredTokens = [];

exports.registerSymbols = async function (address, data) {
    // get assets
    const yesAsset = await dag.readAAStateVar(address, 'yes_asset');
    const noAsset = await dag.readAAStateVar(address, 'no_asset');
    const drawAsset = await dag.readAAStateVar(address, 'draw_asset');

    const yesSymbol = await token_registry.getSymbolByAsset(yesAsset);
    const noSymbol = await token_registry.getSymbolByAsset(noAsset);
    const drawSymbol = drawAsset ? await token_registry.getSymbolByAsset(drawAsset) : null;

    const { yes, no, draw } = await getSymbolsData({ ...data, yes_asset: yesAsset, no_asset: noAsset, draw_asset: drawAsset });

    await operator.start();

    if (!yesSymbol && !registeredTokens.includes(yes.asset)) {
        const regTxId = await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e8,
            data: yes
        });

        if (regTxId) {
            registeredTokens.push(yes.asset);
        } else {
            throw `YES symbol registration error (asset: ${yes.asset}; symbol: ${draw.symbol})`
        }

        await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e4,
            data: {
                withdraw: 1,
                amount: 100000000,
                symbol: yes.symbol,
                asset: yes.asset
            }
        });

    }

    if (!noSymbol && !registeredTokens.includes(no.asset)) {
        const regTxId = await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e8,
            data: no
        });

        if (regTxId) {
            registeredTokens.push(no.asset);
        } else {
            throw `NO symbol registration error (asset: ${no.asset}; symbol: ${draw.symbol})`
        }

        await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e4,
            data: {
                withdraw: 1,
                amount: 100000000,
                symbol: no.symbol,
                asset: no.asset
            }
        });
    }


    if (!drawSymbol && drawAsset && !registeredTokens.includes(draw.asset)) {
        const regTxId = await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e8,
            data: draw
        });

        if (regTxId) {
            registeredTokens.push(draw.asset);
        } else {
            throw `DRAW symbol registration error (asset: ${draw.asset}; symbol: ${draw.symbol})`
        }


        await dag.sendPayment({
            to_address: conf.tokenRegistryAaAddress,
            amount: 1e4,
            data: {
                withdraw: 1,
                amount: 100000000,
                symbol: draw.symbol,
                asset: draw.asset
            }
        });
    }
}


const getSymbolsData = async (data) => {
    const { feed_name, event_date, oracle, reserve_asset, yes_asset, no_asset, draw_asset } = data;
    const momentDate = moment.utc(event_date, 'YYYY-MM-DDTHH:mm:ss').utc();
    const date = momentDate.format((momentDate.hours() === 0 && momentDate.minutes() === 0) ? "YYYY-MM-DD" : "YYYY-MM-DD-hhmm");

    const decimals = await token_registry.getDecimalsBySymbolOrAsset(reserve_asset);

    let yes_symbol;
    let no_symbol;
    let draw_symbol;

    let yes_desc;
    let no_desc;
    let draw_desc;

    if (conf.sportOracleAddress === oracle) {
        const [_, yes_team, no_team] = feed_name.split("_");

        yes_symbol = `${feed_name}_${yes_team}`;
        no_symbol = `${feed_name}_${no_team}`;
        draw_symbol = `${feed_name}_DRAW`;

        const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
        const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);
        const yes_name = yes_abbreviation[1].name || yes_team;
        const no_name = no_abbreviation[1].name || no_team;

        yes_desc = `${yes_name} will win the match against ${yes_name} on ${date} UTC`;
        no_desc = `${no_name} will win the match against ${yes_team} on ${date} UTC`;
        draw_desc = `The match between ${yes_name} and ${no_name} on ${date} UTC will end with a draw`;
    } else {
        yes_symbol = `${feed_name}_${date}_YES`
        no_symbol = `${feed_name}_${date}_NO`
        draw_symbol = `${feed_name}_${date}_DRAW`

        const event = generateTextEvent({ ...data, event_date: moment.utc(event_date, 'YYYY-MM-DDTHH:mm:ss').unix(), isUTC: true });

        yes_desc = `YES-token for event: "${event}"`;
        no_desc = `NO-token for event: "${event}"`;
        draw_desc = `DRAW-token for event: "${event}"`;
    }

    return {
        yes: {
            symbol: await checkAndTransformSymbol(yes_symbol),
            description: yes_desc,
            decimals,
            asset: yes_asset
        },
        no: {
            symbol: await checkAndTransformSymbol(no_symbol),
            description: no_desc,
            decimals,
            asset: no_asset
        },
        draw: {
            symbol: await checkAndTransformSymbol(draw_symbol),
            description: draw_desc,
            decimals,
            asset: draw_asset
        }
    }

}

const checkAndTransformSymbol = async (symbol) => {
    const asset = await token_registry.getAssetBySymbol(symbol);
    let transformedSymbol = symbol;

    if (!asset) {
        return symbol;
    } else {
        const split = symbol.split("_");
        const hasNumber = !isNaN(Number(split[split.length - 1]));

        if (hasNumber) {
            const newNumber = (split.length >= 2 && hasNumber) ? Number(split[split.length - 1]) + 1 : 2;

            transformedSymbol = (hasNumber ? split.slice(0, -1).join("_") : symbol) + "_" + newNumber;

            return await checkAndTransformSymbol(transformedSymbol);
        } else {
            return await checkAndTransformSymbol(`${symbol}_2`);
        }
    }
}