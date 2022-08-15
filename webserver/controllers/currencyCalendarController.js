const { isInteger, min, sample } = require("lodash");
const conf = require('ocore/conf.js');
const moment = require('moment');
const { dag } = require("aabot");

const marketDB = require('../../db');
const { popularPairsByOracle } = require("../../popularPairsByOracle");

const getRate = async (oracle, feed_name) => {
    return await dag.getDataFeed(oracle, feed_name);
}


module.exports = async (request, reply) => {
    const pageInParams = request.params.page;
    const currency = request.params.currency;

    const currencyMarkets = await marketDB.api.getAllMarkets({ oracles: conf.currencyOracleAddresses });

    const takenTimeByPairs = {};
    const currentUTCTime = moment.utc().unix();
    const waiting_period_length = 5 * 24 * 3600;

    const calcQuietPeriod = (eventDataInUnix) => {
        const differ = Math.abs(eventDataInUnix - currentUTCTime);

        if (differ >= 2 * 30 * 24 * 3600) { // 2 months
            return 648000; // 7 days 12 hours
        } else if (differ >= 30 * 24 * 3600) { // 1 month
            return 324000; // 3 days 18 hours
        } else if (differ >= 14 * 24 * 3600) { // 2 weeks
            return 151200; // 1 day 18 hours
        } else if (differ >= 7 * 24 * 3600) { // 1 week
            return 75600; // 21 hours
        } else if (differ >= 2 * 24 * 3600) { // 2 days
            return 43200; // 12 hours
        } else if (differ >= 24 * 3600) { // 1 day
            return 21600; // 6 hours
        } else if (differ >= 12 * 3600) { // 12 hours
            return 5400; // 1 hour 30 min
        } else if (differ >= 6 * 3600) { // 6 hours
            return 3600; // 1 hour
        } else if (differ >= 3 * 3600) {// 3 hours
            return 2700; // 45 min
        } else if (differ >= 2 * 3600) { // 2 hours
            return 3600; // 45 min
        } else if (differ >= 3600) { // 1 hour
            return 1800; // 30 min
        } else { // less 1 hours
            return 0;
        }
    }

    currencyMarkets.forEach(({ feed_name, event_date, quiet_period = 0 }) => {
        if (currentUTCTime <= (event_date - quiet_period)) {
            if (takenTimeByPairs[feed_name] !== undefined) {
                takenTimeByPairs[feed_name].push(event_date);
            } else {
                takenTimeByPairs[feed_name] = [event_date];
            }
        }
    });

    const popularPairs = [];

    Object.entries(popularPairsByOracle).forEach(([oracle, pairs]) => {
        pairs.forEach((feed_name) => {
            if (currency && feed_name.startsWith(currency)) {
                popularPairs.push({
                    feed_name,
                    oracle
                })
            }
        })
    });

    const page = (isInteger(Number(pageInParams)) && pageInParams > 0) ? request.params.page : 1;
    const limit = conf.limitMarketsOnPage;
    const offset = (page - 1) * limit;

    const data = [];

    const rates = {};

    const rateGetters = popularPairs.map(({ oracle, feed_name }) => getRate(oracle, feed_name).then((rate) => rates[feed_name] = rate));

    await Promise.all(rateGetters);

    popularPairs.forEach(async ({ feed_name, oracle }) => {

        const commonData = {
            feed_name,
            oracle,
            comparison: '>',
            expect_datafeed_value: rates[feed_name],
            waiting_period_length
        }

        const takenTime = (takenTimeByPairs[feed_name] || []).map((ts) => ts);

        const currentYear = moment.utc().year();
        const currentMonth = moment.utc().month();
        const currentDay = moment.utc().date();
        const currentHour = moment.utc().hour();

        // expires today
        const todayMarketDate = moment.utc([currentYear, currentMonth, currentDay]).add(1, 'd').unix();

        if (!takenTime.includes(todayMarketDate) && currentHour <= 20) {
            data.push({
                ...commonData,
                event_date: todayMarketDate,
                quiet_period: calcQuietPeriod(todayMarketDate)
            })

            takenTime.push(todayMarketDate);
        }

        // expires tomorrow
        const nextDayMarketDate = moment.utc([currentYear, currentMonth, currentDay]).add(2, 'd').unix();

        if (!takenTime.includes(nextDayMarketDate)) {
            data.push({
                ...commonData,
                event_date: nextDayMarketDate,
                quiet_period: calcQuietPeriod(nextDayMarketDate)
            })

            takenTime.push(nextDayMarketDate);
        }

        // expires next Wednesday
        const nextWeekWednesdayMarketDate = moment.utc([currentYear, currentMonth, currentDay]).add(1, 'w').day(3).unix();

        if (!takenTime.includes(nextWeekWednesdayMarketDate)) {
            data.push({
                ...commonData,
                event_date: nextWeekWednesdayMarketDate,
                quiet_period: calcQuietPeriod(nextWeekWednesdayMarketDate)
            })

            takenTime.push(nextWeekWednesdayMarketDate);
        }

        // expires in 2 weeks on Wednesday
        const wednesdayInTwoWeeksMarketDate = moment.utc([currentYear, currentMonth, currentDay]).add(2, 'w').day(3).unix();

        if (!takenTime.includes(wednesdayInTwoWeeksMarketDate)) {
            data.push({
                ...commonData,
                event_date: wednesdayInTwoWeeksMarketDate,
                quiet_period: calcQuietPeriod(wednesdayInTwoWeeksMarketDate)
            })

            takenTime.push(wednesdayInTwoWeeksMarketDate);
        }

        // expires next month
        const nextMonthMarketDate = moment.utc([currentYear, currentMonth, 1]).add(1, 'month').unix();

        if (!takenTime.includes(nextMonthMarketDate)) {
            data.push({
                ...commonData,
                event_date: nextMonthMarketDate,
                quiet_period: calcQuietPeriod(nextMonthMarketDate),
                waiting_period_length
            })

            takenTime.push(nextMonthMarketDate);
        }

        // expires in two months
        const afterTwoMonthsMarketDate = moment.utc([currentYear, currentMonth, 1]).add(2, 'month').unix();

        if (!takenTime.includes(afterTwoMonthsMarketDate)) {
            data.push(
                {
                    ...commonData,
                    event_date: afterTwoMonthsMarketDate,
                    quiet_period: calcQuietPeriod(afterTwoMonthsMarketDate),
                    waiting_period_length
                }
            );

            takenTime.push(afterTwoMonthsMarketDate);
        }
    });

    reply.send({
        data: data.sort((a, b) => a.event_date - b.event_date).slice(offset, offset + limit),
        count: data.length
    });
}