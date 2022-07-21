const { isInteger, min, sample } = require("lodash");
const conf = require('ocore/conf.js');
const moment = require('moment');
const { dag } = require("aabot");

const marketDB = require('../../db');
const { popularPairs } = require("../../popularPairs");

const getDecimals = (value) => {
    const valueStr = String(value);

    return (~(valueStr + "").indexOf(".") ? (valueStr + "").split(".")[1].length : 0)
}

const getRate = async (feed_name) => {
    return await dag.getDataFeed(conf.currencyOracleAddress, feed_name);
}


module.exports = async (request, reply) => {
    const pageInParams = request.params.page;
    const currency = request.params.currency;

    const currencyMarkets = await marketDB.api.getAllMarkets(conf.currencyOracleAddress);

    const takenTimeByPairs = {};
    const currentUTCTime = moment.utc().unix();

    currencyMarkets.forEach(({ feed_name, event_date, quiet_period = 0 }) => {
        if (currentUTCTime <= (event_date - quiet_period)) {
            if (takenTimeByPairs[feed_name] !== undefined) {
                takenTimeByPairs[feed_name].push(event_date);
            } else {
                takenTimeByPairs[feed_name] = [event_date];
            }
        }
    });

    const freePairs = popularPairs.filter((feed_name) => !currency || feed_name.startsWith(currency));

    const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? request.params.page : 1;
    const limit = conf.limitMarketsOnPage;
    const offset = (page - 1) * limit;

    const data = [];

    const rates = {};

    const rateGetters = freePairs.map((feed_name) => getRate(feed_name).then((rate) => rates[feed_name] = rate));

    await Promise.all(rateGetters);

    freePairs.forEach(async (feed_name) => {
        const commonData = {
            feed_name,
            oracle: conf.currencyOracleAddress
        }

        const currentRate = rates[feed_name];

        const decimalsOfRate = getDecimals(currentRate);

        const samples = [sample([1, -1]), sample([1, -1]), sample([1, -1]), sample([1, -1]), sample([1, -1]), sample([1, -1])];

        const expectDecimals = currentRate > 1 ? min([decimalsOfRate, 4]) : decimalsOfRate;
        const takenTime = (takenTimeByPairs[feed_name] || []).map((ts) => ts - currentUTCTime);

        if (!takenTime.find((t) => t <= 24 * 3600)) {
            data.push({
                ...commonData,
                event_date: moment.utc().hour() >= 23 ? 3600 * 24 : moment.utc().add(1, 'day').hours(0).minutes(0).seconds(0).unix(),
                quiet_period: moment.utc().hour() >= 23 ? 3600 : 1800,
                waiting_period_length: 3600 * 2,
                expect_datafeed_value: +Number(currentRate + samples[0] * 0.02 * currentRate).toFixed(expectDecimals),
                comparison: samples[0] > 0 ? '>' : '<'
            })
        }

        if (!takenTime.find((t) => (t > 24 * 3600) && (t <= 3600 * 24 * 2))) {
            data.push({
                ...commonData,
                event_date: currentUTCTime + 3600 * 24 * 2,
                quiet_period: 3600 * 3,
                waiting_period_length: 3600 * 6,
                expect_datafeed_value: +Number(currentRate + samples[1] * 0.03 * currentRate).toFixed(expectDecimals),
                comparison: samples[1] > 0 ? '>' : '<'
            })
        }

        if (!takenTime.find((t) => (t > 2 * 24 * 3600) && (t <= 3600 * 24 * 7))) {
            data.push({
                ...commonData,
                event_date: currentUTCTime + 3600 * 24 * 7,
                quiet_period: 3600 * 8,
                waiting_period_length: 3600 * 9,
                expect_datafeed_value: +Number(currentRate + samples[2] * 0.06 * currentRate).toFixed(expectDecimals),
                comparison: samples[2] > 0 ? '>' : '<'
            })
        }

        if (!takenTime.find((t) => (t > 7 * 24 * 3600) && (t <= 3600 * 24 * 14))) {
            data.push({
                ...commonData,
                event_date: currentUTCTime + 3600 * 24 * 14,
                quiet_period: 3600 * 12,
                waiting_period_length: 3600 * 12,
                expect_datafeed_value: +Number(currentRate + samples[3] * 0.08 * currentRate).toFixed(expectDecimals),
                comparison: samples[3] > 0 ? '>' : '<'
            })
        }

        if (!takenTime.find((t) => (t > 14 * 24 * 3600) && (t <= 3600 * 24 * 30))) {
            data.push({
                ...commonData,
                event_date: currentUTCTime + 3600 * 24 * 30,
                quiet_period: 3600 * 24,
                waiting_period_length: 3600 * 24,
                expect_datafeed_value: +Number(currentRate + samples[4] * 0.1 * currentRate).toFixed(expectDecimals),
                comparison: samples[4] > 0 ? '>' : '<'
            })
        }

        if (!takenTime.find((t) => (t > 30 * 24 * 3600) && (t <= 3600 * 24 * 60))) {
            data.push(
                {
                    ...commonData,
                    event_date: currentUTCTime + 3600 * 24 * 60,
                    quiet_period: 3600 * 48,
                    waiting_period_length: 3600 * 24,
                    expect_datafeed_value: +Number(currentRate + samples[5] * 0.12 * currentRate).toFixed(expectDecimals),
                    comparison: samples[5] > 0 ? '>' : '<'
                }
            );
        }
    });

    reply.send({
        data: data.slice(offset, offset + limit),
        count: data.length,
        popularPairs
    });
}