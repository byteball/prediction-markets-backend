const moment = require('moment');
const conf = require('ocore/conf.js');
const locale = require('../locale');

require('moment/locale/es');
require('moment/locale/pt-br');
require('moment/locale/zh-cn');
require('moment/locale/ru');
require('moment/locale/uk');

exports.generateTextEvent = ({ oracle, event_date, feed_name, datafeed_value, comparison, isUTC = false, yes_team_name, no_team_name, languageKey = "en" }) => { // params
    moment.locale(getMomentLocaleByLanguageKey(languageKey)); // set locale for date formatting

    const format = ["ru", "uk"].includes(languageKey) ? "D MMMM gggg [в] LT" : "LLL"; // different date format for Russian and Ukrainian
    const expiry_date = isUTC ? moment.unix(event_date).utc().format(format) : moment.unix(event_date).format(format);
    const comparisonText = getComparisonText(comparison, languageKey); // get comparison text based on comparison operator

    if (conf.currencyOracleAddresses.includes(oracle)) { // check if oracle is a currency oracle
        const [from, to] = feed_name.split("_");
        return locale[languageKey].fn_currency_text({ from_currency: from, comparisonText, value: datafeed_value, to_currency: to, expiry_date, isUTC });
    } else if (conf.sportOracleAddress === oracle) { // check if oracle is a sport oracle
        // eslint-disable-next-line no-unused-vars
        const [_, yes_team, no_team] = feed_name.split("_");

        return locale[languageKey].fn_sport_text({ yes_team: yes_team_name || yes_team, no_team: no_team_name || no_team, expiry_date, isUTC });
    } else {
        return locale[languageKey].fn_default_text({ feed_name, comparisonText, datafeed_value, expiry_date, isUTC });
    }
}

const getComparisonText = (comparison, languageKey) => {
    if (!(languageKey in locale)) throw new Error(`Language key ${languageKey} not found in locale`);

    if (comparison === '>') return locale[languageKey].above;
    if (comparison === '<') return locale[languageKey].below;
    if (comparison === '>=') return locale[languageKey].above_or_equal;
    if (comparison === '<=') return locale[languageKey].below_or_equal;
    if (comparison === '==') return locale[languageKey].equal;
    if (comparison === '!=') return locale[languageKey].not_equal;
}

const getMomentLocaleByLanguageKey = (languageKey) => {
    if (languageKey === 'zh') return 'zh-cn';
    if (languageKey === 'pt') return 'pt-br';

    return languageKey;
}