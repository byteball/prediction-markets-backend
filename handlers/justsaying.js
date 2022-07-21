const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');

const { tokenRegistryResponseHandler } = require("./tokenRegistry");

exports.justsayingHandler = function (ws, subject, body) {
  switch (subject) {
    case 'light/aa_response':
      if (body.aa_address === conf.token_registry_aa_address)
        tokenRegistryResponseHandler(body);
      break;

    case 'light/have_updates':
      lightWallet.refreshLightClientHistory(); // needed
      break;
  }
}