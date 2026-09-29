const conf = require('ocore/conf.js');

exports.getFactoryVersion = (factory) => {
    if (conf.factoryAasV2.includes(factory)) return 2;
    if (conf.factoryAas.includes(factory)) return 1;

    return null;
}

// the first two v1 factories were replaced, we ignore the markets created by them after the upgrades
exports.isSupportedMarket = ({ factory, created_at }) => {
    if (factory === conf.factoryAas[0]) return created_at <= conf.factoryUpgradeFixQuietPeriodTimestamp;
    if (factory === conf.factoryAas[1]) return created_at <= conf.factoryUpgradeRemoveIssueFeeForLiqTimestamp;

    return exports.getFactoryVersion(factory) !== null;
}
