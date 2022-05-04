const conf = require('ocore/conf.js');
const { getStateVarsForPrefixes } = require('./getStateVarsForPrefixes');

exports.getSymbolAndDecimalsByAsset = async function (asset) {
	let results;

	if (asset === 'base') {
		results = { symbol: 'GBYTE', decimals: 9 }
	} else {

		let registryVars = await getStateVarsForPrefixes(conf.token_registry_aa_address, [
			'a2s_' + asset,
			'current_desc_' + asset
		]);

		const current_desc = registryVars['current_desc_' + asset];

		registryVars = Object.assign(registryVars, await getStateVarsForPrefixes(conf.token_registry_aa_address, ['decimals_' + current_desc, 'desc_' + current_desc]));
		symbol = registryVars['a2s_' + asset];
		decimals = registryVars['decimals_' + current_desc] || 0;

		results = { symbol, decimals }
	}

	return results
}