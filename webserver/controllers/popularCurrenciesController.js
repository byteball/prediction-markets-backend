const { popularPairsByOracle } = require("../../popularPairsByOracle");

module.exports = async (_, reply) => {
	try {
		reply.send(popularPairsByOracle);
	} catch (e) {
		console.error('popularCurrenciesController error', e);
	}
}