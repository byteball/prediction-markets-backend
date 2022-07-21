const { default: axios } = require('axios');
const { isInteger } = require('lodash');
const db = require('ocore/db.js');
const conf = require('ocore/conf.js');
const moment = require('moment');

const abbreviations = require('../../abbreviations.json');
const marketDB = require('../../db');
const { sportDataService } = require('../../SportData');

const limit = conf.limitMarketsOnPage;

let cacheRate = {
	lastUpdate: 0,
	data: {}
}

const filterByType = (type, championship) => {
	let query = '';

	if (type === 'currency') {
		query = `WHERE markets.oracle='${conf.currencyOracleAddress}'`;
	} else if (type === 'soccer') {
		query = `WHERE markets.oracle='${conf.sportOracleAddress}'`

		if (championship) {
			query += ` AND upper(feed_name) like '${championship}%'`;
		}
	} else if (type === 'misc') {
		query = `WHERE markets.oracle != '${conf.currencyOracleAddress}' AND markets.oracle != '${conf.sportOracleAddress}'`;
	}

	// include only allowed reserve assets
	query += ` ${(type === 'currency' || type === 'soccer' || type === 'misc') ? 'AND' : "WHERE"} (${Object.keys(conf.supported_reserve_assets).map((asset, index) => `${index ? 'OR' : ''} markets.reserve_asset='${asset}'`).join(' ')})`;

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
		rows = await db.query(`SELECT * FROM markets LEFT JOIN market_assets USING (aa_address) ${filterByType(type, championship)}`);
		count = rows.length;
	} catch {
		console.error("get markets error");
		reply.send([]);
	}

	try {
		const gettersActualData = rows.map((row, i) => marketDB.api.getActualMarketInfo(row.aa_address).then(data => rows[i] = { ...rows[i], ...data }));
		const gettersCandle = rows.map((row, i) => marketDB.api.getCloses({ aa_address: row.aa_address, type: 'hourly', onlyYesPrices: true }).then(data => rows[i].candles = data));

		rows.forEach((row, i) => {
			if (row.oracle === conf.sportOracleAddress) {
				const [championship, yes_team, no_team, date] = row.feed_name.split("_");

				if (championship && yes_team && no_team && date) {
					const yes_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === yes_team);
					const no_abbreviation = Object.entries(abbreviations.soccer).find(([index, item]) => item.abbreviation === no_team);

					if (yes_abbreviation) {
						rows[i].yes_team_id = yes_abbreviation[0];
						rows[i].yes_team = yes_abbreviation[1].name;
					}

					if (no_abbreviation) {
						rows[i].no_team_id = no_abbreviation[0];
						rows[i].no_team = no_abbreviation[1].name;
					}

					let championshipInfo;
					try {
						championshipInfo = sportDataService.getChampionshipInfo('soccer', championship);
					} catch {
						championshipInfo = {};
					}

					rows[i].league_emblem = championshipInfo.emblem || null;
					rows[i].league = championshipInfo.name || null;
				}
			}
		});

		await Promise.all(gettersActualData);
		await Promise.all(gettersCandle);
	} catch (e) {
		console.error('error in getters', e)
	}


	if (Object.keys(cacheRate.data).length === 0 || cacheRate.lastUpdate < Date.now() - (1800 * 1000)) {
		try {
			const data = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.values(conf.supported_reserve_assets).map(({ symbol }) => symbol).join(",")}&tsyms=USD`).then(({ data }) => {
				const res = {};

				Object.entries(data).forEach(([name, value]) => {
					const assetBySymbol = Object.entries(conf.supported_reserve_assets).find(([_, { symbol }]) => symbol === name)[0];
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
		const oldMarkets = [];

		const sortedRows = rows.sort((b, a) => ((a.reserve || 0) / (10 ** a.reserve_decimals)) * cacheRate.data[a.reserve_asset] - ((b.reserve || 0) / 10 ** b.reserve_decimals) * cacheRate.data[b.reserve_asset])

		sortedRows.forEach(row => {
			if (now >= row.event_date) {
				oldMarkets.push(row);
			} else {
				actualMarkets.push(row);
			}
		});

		// add APY
		const data = [...actualMarkets, ...oldMarkets].slice(offset, offset + limit).map((allData) => {
			const { coef, issue_fee, created_at } = allData;
			const elapsed_seconds = moment.utc().unix() - created_at;

			const apy = coef !== 1 ? Number(((coef * (1 - issue_fee)) ** (31536000 / elapsed_seconds) - 1) * 100).toFixed(2) : 0;

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