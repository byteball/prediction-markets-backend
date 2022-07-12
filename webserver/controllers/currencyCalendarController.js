const { isInteger, shuffle, min } = require("lodash");
const conf = require('ocore/conf.js');
const moment = require('moment');
const { dag } = require("aabot");

const marketDB = require('../../db');

const popularPairs = [
    "GBYTE_USD",
    "GBYTE_BTC",
    "BTC_USD",
    "ETH_USD",
    "ETH_BTC",
    "AAPL_USD",
    "AMZN_USD",
    "BAT_USD",
    "DAI_USD",
    "DASH_USD",
    "DOGE_USD",
    "TWTR_USD",
    "UBER_USD",
    "WBTC_USD",
    "BNB_BTC",
    "BNB_USD",
    "MATIC_USD"
];

const getDecimals = (value) => {
    const valueStr = String(value);

    return (~(valueStr + "").indexOf(".") ? (valueStr + "").split(".")[1].length : 0)
}

const getRate = async (feed_name) => {
    return await dag.getDataFeed(conf.currencyOracleAddress, feed_name);
}


module.exports = async (request, reply) => {
    const pageInParams = request.params.page;

    const currencyMarkets = await marketDB.api.getAllMarkets(conf.currencyOracleAddress);

    const takenPairs = [];
    const currentUTCTime = moment.utc().unix();


    currencyMarkets.forEach(({ feed_name, end_of_trading_period }) => {
        if (currentUTCTime <= end_of_trading_period) {
            takenPairs.push(feed_name);
        }
    });

    const freePairs = popularPairs.filter((feed_name) => !takenPairs.includes(feed_name));

    const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? request.params.page : 1;
    const limit = conf.limitMarketsOnPage;
    const offset = (page - 1) * limit;

    const end_of_trading_period_list = [moment.utc().hour() >= 23 ? 3600 * 24 : moment.utc().add(1, 'day').hours(0).minutes(0).seconds(0).unix(), currentUTCTime + 3600 * 24 * 2, currentUTCTime + 3600 * 24 * 7, currentUTCTime + 3600 * 24 * 14, currentUTCTime + 3600 * 24 * 30]
    const waiting_period_list = [3600 * 2, 3600 * 6, 3600 * 9, 3600 * 12, 3600 * 24]


    const prepareData = shuffle(freePairs.slice(offset, offset + limit)).map((feed_name, index) => ({
        oracle: conf.currencyOracleAddress,
        feed_name,
        end_of_trading_period: end_of_trading_period_list[index],
    }));

    const data = [];

    const rateGetters = prepareData.map(({ feed_name }, index) => getRate(feed_name).then((currentRate) => {
        let expect_datafeed_value = currentRate + ((index % 2 === 0 ? 1 : -1) * 0.02 * index * currentRate);

        const decimalsOfRate = getDecimals(currentRate);

        if (expect_datafeed_value > 1) {
            expect_datafeed_value = +Number(expect_datafeed_value).toFixed(min([decimalsOfRate, 4]));
        } else {
            expect_datafeed_value = +Number(expect_datafeed_value).toFixed(decimalsOfRate);
        }

        data.push({
            ...prepareData[index],
            expect_datafeed_value,
            comparison: index % 2 === 0 ? '>' : '<',
            waiting_period_length: waiting_period_list[index],
        })
    }));

    await Promise.all(rateGetters);

    reply.send({
        data,
        count: freePairs.length
    });
}

