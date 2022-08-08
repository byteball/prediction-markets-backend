const conf = require('ocore/conf.js');

// All feed_names must be unique

exports.popularPairsByOracle = {
    [conf.currencyOracleAddresses[0]] : [
        "GBYTE_USD",
        "GBYTE_BTC",
        "BTC_USD",
        "ETH_USD",
        "ETH_BTC",
        "BAT_USD",
        "DAI_USD",
        "DAI_BTC",
        "DOGE_USD",
        "BNB_BTC",
        "BNB_USD",
        "MATIC_USD",
        "MATIC_BTC"
    ]
}