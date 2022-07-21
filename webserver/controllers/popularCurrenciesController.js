const { popularPairs } = require("../../popularPairs");

module.exports = async (_, reply) => {
	try {
		reply.send(popularPairs);
	} catch (e) {
		console.error('popularCurrenciesController error', e);
	}
}