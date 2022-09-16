const moment = require('moment');

const BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY = "AXG7G57VBLAHF3WRN5WMQ53KQEQDRONC";
const SECONDS_IN_YEAR = 60 * 60 * 24 * 365;

exports.getEstimatedAPY = ({ base_aa, committed_at, created_at, coef, issue_fee, first_trade_at }) => { // params + coef + first_trade_at
    const elapsed_seconds = (committed_at || moment.utc().unix()) - (first_trade_at || created_at);

    if (base_aa === BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY) {
        return coef !== 1 ? Number(((coef * (1 - issue_fee)) ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100) : 0;
    } else {
        return coef !== 1 ? Number((coef ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100) : 0;
    }
}