const { default: axios } = require('axios');
const { isInteger } = require('lodash');
const db = require('ocore/db.js');
const conf = require('ocore/conf.js');
const moment = require('moment');

const abbreviations = require('abbreviations');
const marketDB = require('../../db');
const { sportDataService } = require('../../SportData');
const { getEstimatedAPY } = require('../../utils/getEstimatedAPY');

const limit = conf.limitMarketsOnPage;

let cacheRate = {
	lastUpdate: 0,
	data: {}
}

const filterByType = (type, championship) => {
	let query = '';

	if (type === 'currency') {
		query = `WHERE markets.oracle IN (${"'" + conf.currencyOracleAddresses.join("','") + "'"})`
	} else if (type === 'soccer') {
		query = `WHERE markets.oracle='${conf.sportOracleAddress}'`

		if (championship) {
			query += ` AND upper(feed_name) like '${championship}%'`;
		}
	} else if (type === 'misc') {
		query = `WHERE markets.oracle NOT IN (${"'" + [...conf.currencyOracleAddresses, conf.sportOracleAddress].join("','") + "'"})`
	}

	// include only allowed reserve assets
	query += ` ${(type === 'currency' || type === 'soccer' || type === 'misc') ? 'AND' : "WHERE"} (${Object.keys(conf.supportedReserveAssets).map((asset, index) => `${index ? 'OR' : ''} markets.reserve_asset='${asset}'`).join(' ')})`;

	query += ` AND market_assets.yes_symbol IS NOT NULL AND market_assets.no_symbol IS NOT NULL AND (markets.allow_draw == 0 OR market_assets.draw_symbol IS NOT NULL)`

	return query;
}

module.exports = async (request, reply) => {
	const pageInParams = request.params.page;
	const query = request.query;
	const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? request.params.page : 1;
	const type = query.type;
	const championship = (query.championship || '').replace(/[^a-z0-9]/gi, '');
	const offset = (page - 1) * limit;
	const now = moment.utc().unix();

	let rows;
	let count = 0;
	try {
		rows = await db.query(`SELECT * FROM markets LEFT JOIN market_assets USING (aa_address) LEFT JOIN bookmaker_odds USING (feed_name) ${filterByType(type, championship)} ORDER BY event_date ASC`);
		count = rows.length;
	} catch {
		console.error("get markets error");
		reply.send([]);
	}

	try {
		rows.forEach((row, i) => {
			if (row.oracle === conf.sportOracleAddress) {
				const [championship, yes_team, no_team, date] = row.feed_name.split("_");

				if (championship && yes_team && no_team && date) {
					const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
					const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);

					if (yes_abbreviation) {
						rows[i].yes_team_id = yes_abbreviation[0];
						rows[i].yes_crest_url = sportDataService.getCrest('soccer', championship, yes_abbreviation[0]);
						rows[i].yes_team = yes_abbreviation[1].name;
					}

					if (no_abbreviation) {
						rows[i].no_team_id = no_abbreviation[0];
						rows[i].no_crest_url = sportDataService.getCrest('soccer', championship, no_abbreviation[0]);
						rows[i].no_team = no_abbreviation[1].name;
					}

					const championshipInfo = sportDataService.getChampionshipInfo('soccer', championship);

					rows[i].league_emblem = championshipInfo.emblem || null;
					rows[i].league = championshipInfo.name || null;
				}
			}
		});
	} catch (e) {
		console.error('soccer info error', e)
	}

	if (Object.keys(cacheRate.data).length === 0 || cacheRate.lastUpdate < Date.now() - (1800 * 1000)) {
		try {
			const data = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.values(conf.supportedReserveAssets).map(({ symbol }) => symbol).join(",")}&tsyms=USD`).then(({ data }) => {
				const res = {};

				Object.entries(data).forEach(([name, value]) => {
					const assetBySymbol = Object.entries(conf.supportedReserveAssets).find(([_, { symbol }]) => symbol === name)[0];
					res[assetBySymbol] = value.USD;
				});

				return res;
			});

			cacheRate = {
				data,
				lastUpdate: Date.now()
			}
		} catch (err) {
			console.error(err)
		}
	}

	try {

		const actualMarkets = [];
		let oldMarkets = [];

		const sortedRows = rows.sort((b, a) => ((a.reserve || 0) / (10 ** a.reserve_decimals)) * cacheRate.data[a.reserve_asset] - ((b.reserve || 0) / 10 ** b.reserve_decimals) * cacheRate.data[b.reserve_asset])

		sortedRows.forEach(row => {
			if (now >= row.event_date) {
				oldMarkets.push(row);
			} else {
				actualMarkets.push(row);
			}
		});

		oldMarkets = oldMarkets.sort((a, b) => b.event_date - a.event_date);

		// add APY
		let data = [...actualMarkets, ...oldMarkets].slice(offset, offset + limit);

		const gettersCandle = data.map((row, i) => marketDB.api.getCandles({ aa_address: row.aa_address, type: 'hourly', onlyYesPrices: true, limit: 24, params: data[i] }).then(candles => data[i].candles = candles).catch((e) => console.error('get candles error', e)));
		const gettersFirstTrade = data.map((row, i) => marketDB.api.getTradeEventsByMarket(row.aa_address, { limit: 1, sort: 'ASC' }).then(({ data: first_trade_ts }) => data[i].first_trade_at = first_trade_ts?.[0]?.timestamp || null).catch(console.error));
		const gettersActualData = data.map((row, i) => marketDB.api.getActualMarketInfo(row.aa_address).then(actualData => data[i] = { ...data[i], ...actualData }).catch((e) => console.error('get actual data error', e)));

		await Promise.all(gettersActualData);
		await Promise.all(gettersCandle);
		await Promise.all(gettersFirstTrade);

		data = data.map((allData) => {
			const apy = getEstimatedAPY(allData).toFixed(2);

			return ({
				...allData,
				apy
			})
		});

		reply.send({ data, max_count: count });
	} catch (e) {
		console.error(e)
	}
}