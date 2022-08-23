const moment = require('moment');
const conf = require('ocore/conf.js');

exports.generateTextEvent = ({ oracle, event_date, feed_name, datafeed_value, comparison, isUTC = false }) => { // params
    const expiry_date = isUTC ? moment.unix(event_date).utc().format("LLL") : moment.unix(event_date).format("LLL");
    const comparisonText = getComparisonText(comparison);

    if (conf.currencyOracleAddresses.includes(oracle)) {
        const [from, to] = feed_name.split("_");

        return `Will ${from} be ${comparisonText} ${datafeed_value} ${to} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
    } else if (conf.sportOracleAddress = oracle) {
        // eslint-disable-next-line no-unused-vars
        const [_, yes_team, no_team] = feed_name.split("_");

        return `${yes_team} vs ${no_team} for ${expiry_date}`;
    } else {
        return `Will ${feed_name} be ${comparisonText} ${datafeed_value} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
    }
}

const getComparisonText = (comparison) => {
    if (comparison === '>') return 'above';
    if (comparison === '<') return 'below';
    if (comparison === '>=') return 'above or equal';
    if (comparison === '<=') return 'below or equal';
    if (comparison === '==') return 'equal';
    if (comparison === '!=') return 'not equal';
}