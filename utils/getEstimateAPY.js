const moment = require('moment');

const BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY = "AXG7G57VBLAHF3WRN5WMQ53KQEQDRONC";

exports.getEstimateAPY = ({ base_aa, committed_at, created_at, coef, issue_fee }) => { // params + coef
    const elapsed_seconds = (committed_at || moment.utc().unix()) - created_at;

    if (base_aa === BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY) {
        return coef !== 1 ? Number(((coef * (1 - issue_fee)) ** (31536000 / elapsed_seconds) - 1) * 100) : 0;
    } else {
        return coef !== 1 ? Number((coef ** (31536000 / elapsed_seconds) - 1) * 100) : 0;
    }
}