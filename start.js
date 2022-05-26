const conf = require('ocore/conf.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const wallet_general = require('ocore/wallet_general.js');
const db = require('ocore/db.js');
const dag = require('aabot/dag.js');

const marketDB = require('./db');

const { justsayingHandler, responseHandler } = require('./handlers');
const webserver = require('./webserver');
const { footballDataService } = require('./FootballData');

lightWallet.setLightVendorHost(conf.hub);

eventBus.once('connected', function (ws) {
  network.initWitnessesIfNecessary(ws, start);
});

async function addWatchedAas() {
  wallet_general.addWatchedAddress(conf.factory_aa, null, console.log);
  network.addLightWatchedAa(conf.token_registry_aa_address, null, console.log)
};

async function watchMarketAa(objAa) {
  return new Promise(async function (resolve) {
    wallet_general.addWatchedAddress(objAa.address, resolve);
  });
}

async function discoverMarketsAas() {
  const factoryStateVars = await dag.readAAStateVars(conf.factory_aa);
  const allMarkets = Object.keys(factoryStateVars).map((name) => name.replace("prediction_", ""));
  const rows = await db.query("SELECT aa_address FROM markets");
  const knownAaAddresses = rows.map(obj => obj.aa_address);
  const newMarketsAas = allMarkets.filter(address => !knownAaAddresses.includes(address));

  await Promise.all(newMarketsAas.map((aa) => watchMarketAa(aa)));
}

async function start() {
  await marketDB.create();
  addWatchedAas();

  eventBus.on('connected', addWatchedAas);

  lightWallet.refreshLightClientHistory();

  lightWallet.waitUntilHistoryRefreshDone(async () => {
    await discoverMarketsAas()
    await marketDB.api.refreshSymbols();
    await footballDataService.init();

    webserver.start();
    console.error('webserver has been started');
  });
}

eventBus.on('aa_response', responseHandler);
eventBus.on("message_for_light", justsayingHandler);
process.on('unhandledRejection', up => { throw up });
