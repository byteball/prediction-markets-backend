const conf = require('ocore/conf.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const wallet_general = require('ocore/wallet_general.js');
const db = require('ocore/db.js');
const dag = require('aabot/dag.js');
const clc = require("cli-color");
const operator = require('aabot/operator.js');

const marketDB = require('./db');

const { justsayingHandler, responseHandler } = require('./handlers');
const webserver = require('./webserver');
const { sportDataService } = require('./SportData');
const { wait } = require('./utils/wait');
const ResultCommitter = require('./resultCommitter');

lightWallet.setLightVendorHost(conf.hub);

eventBus.once('connected', function (ws) {
  network.initWitnessesIfNecessary(ws, start);
});

async function addWatchedAas() {
  conf.factoryAas.map((address) => wallet_general.addWatchedAddress(address, null, console.log));
  network.addLightWatchedAa(conf.tokenRegistryAaAddress, null, console.log)
};

async function watchMarketAa(objAa) {
  return new Promise(async function (resolve) {
    wallet_general.addWatchedAddress(objAa.address, resolve);
  });
}

async function discoverMarketAas() {
  let factoryStateVars = {};

  const stateVarsGetter = conf.factoryAas.map((aa) => dag.readAAStateVars(aa).then((stateVars) => Object.assign(factoryStateVars, { [aa]: stateVars })));

  await Promise.all(stateVarsGetter);

  const allMarkets = [];

  Object.entries(factoryStateVars).forEach(([factory, stateVars]) => {
    Object.keys(stateVars).forEach((key) => {
      const { created_at } = stateVars[key];
      const marketAddress = key.replace("prediction_", "");

      if ((factory === conf.factoryAas[0] && created_at <= factoryUpgradeFixQuietPeriodTimestamp) || (factory === conf.factoryAas[1] && created_at <= factoryUpgradeRemoveIssueFeeForLiqTimestamp) || factory === conf.factoryAas[2]) {
        allMarkets.push(marketAddress);
      } else {
        console.error('ignore ', marketAddress);
      }
    })
  })

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

  await lightWallet.waitUntilHistoryRefreshDone();

  await dag.loadAA(conf.tokenRegistryAaAddress);

  await wait(60 * 1000);

  await discoverMarketAas()
  await marketDB.api.refreshSymbols();

  await sportDataService.init();

  webserver.start();
  console.error('webserver has been started');

  if (conf.enableCommitter) {
    const committer = new ResultCommitter();

    await committer.init();
  }

  if (conf.automaticSymbolsReg) {
    await operator.start();

    const address = await operator.getAddress();

    if (!address) throw "no address, please check conf.js";

    const balance = await dag.readBalance(address);

    const reserve_balance = balance?.base?.total || 0;

    if (reserve_balance < 1e9) {
      throw clc.red.bold('Your wallet contains less than 1 GBYTE.')
    }

    if (!conf.admin_email || !conf.from_email) {
      throw clc.red.bold('please specify admin_email and from_email in your conf.json');
    }
  }
}

eventBus.on('aa_response', responseHandler);
eventBus.on("message_for_light", justsayingHandler);
process.on('unhandledRejection', up => { throw up });
