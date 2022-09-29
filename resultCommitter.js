const dag = require('aabot/dag.js');
const clc = require("cli-color");
const { bind } = require('lodash');
const operator = require('aabot/operator.js');
const device = require('ocore/device');
const conf = require('ocore/conf.js');
const eventBus = require('ocore/event_bus.js');

const correspondents = require('./utils/correspondents');

const marketDB = require('./db');

const CHECK_INTERVAL = 1000 * 60 * 10; // 10 min

class ResultCommitter {
    constructor() {
        this.intervalId = null;
        this.listOfCommittedMarkets = [];
        this.oracle_device_address = null;
        this.listOfMarketsWithRequestedResult = [];
        this.answer = null;
    }

    async init() {
        await operator.start();

        const address = await operator.getAddress();
        if (!address) throw "no address, please check conf.js";

        const balance = await dag.readBalance(address);

        this.balance = balance?.base?.total || 0;
        let oracle_device_address;

        if (this.balance <= 1e6) {
            throw clc.red.bold(`


                ##################################################################################
                ${address} balance: ${+Number(this.balance / 1e9).toFixed(9)} GBYTE. ${balance?.base?.pending ? `(Pending: ${+Number((balance?.base?.pending || 0) / 1e9).toFixed(9)} GBYTE)` : ''}
                Your wallet contains less than 0.01 GBYTE.
                Please replenish it or change the enableCommitter parameter in the conf file.
                ##################################################################################
                
                
                `)
        } else {
            console.error(clc.green.bold(`
                ################################################################
                ${address} balance: ${+Number(this.balance / 1e9).toFixed(9)} GBYTE.
                ################################################################
                `))
        }


        const correspondent = await correspondents.findCorrespondentByPairingCode(conf.sportOraclePairingCode);
        console.log(`sport oracle found in db`, correspondent);

        if (!correspondent) {
            oracle_device_address = await correspondents.addCorrespondent(conf.sportOraclePairingCode, 'Sport Oracle');
            console.log(`added oracle correspondent`, oracle_device_address);
            if (!oracle_device_address)
                throw Error(`no oracle device address`);
        } else {
            oracle_device_address = correspondent.device_address;
        }

        eventBus.on('text', (from_address, user_message) => {
            if (user_message.indexOf('The data will be added into the database')) return;
            if (user_message.indexOf('Sport oracle posted')) return;

            if (
                user_message.indexOf('Result is being retrieved, please wait.') >= 0 ||
                user_message.indexOf('The data is already in the database') >= 0
            ) {
                this.answer = true;
            } else {
                this.answer = false;
            }
        })
        this.oracle_device_address = oracle_device_address;

        this.intervalId = setInterval(bind(this.checkAndCommit, this), CHECK_INTERVAL);
        console.log('init done');
    }

    async sendResultRequest(oracle_device_address, msg) {
        console.log(`will send result request to oracle ${oracle_device_address}`, msg);
        if (!oracle_device_address)
            throw Error(`empty oracle device address`);
        const committerContext = this;

        return new Promise((resolve) => {
            device.sendMessageToDevice(oracle_device_address, 'text', msg, {
                ifOk: async () => {
                    let lastTs = Date.now();

                    let intervalId = setInterval(() => {
                        if (committerContext.answer !== null) {
                            const answer = committerContext.answer;
                            committerContext.answer = null;
                            clearInterval(intervalId);

                            resolve(answer);
                        } else if ((Date.now() - lastTs) > 10 * 1000) {

                            console.error('oracle not responding', Date.now());
                            clearInterval(intervalId);
                            resolve(false);

                        }
                    }, 100);
                },
                ifError: (err) => {
                    console.log('requesting result from oracle failed', err);
                    resolve(false);
                }
            });
        })
    }

    async checkAndCommit() {
        console.log('checkAndCommit');
        const markets = await marketDB.api.getAllMarkets({ waitingResult: true });

        const dataFeedsGetters = markets.map(({ oracle, feed_name, aa_address }) => dag.getDataFeed(oracle, feed_name).then((value) => ({ address: aa_address, value, feed_name, oracle })).catch(() => ({ address: aa_address, value: null, feed_name, oracle })))

        const dataFeeds = await Promise.all(dataFeedsGetters);

        for (const { address, value, feed_name, oracle } of dataFeeds) {
            if (value !== null && !this.listOfCommittedMarkets.includes(address)) {
                try {

                    dag.sendPayment({
                        to_address: address,
                        amount: 1e4,
                        data: {
                            commit: 1
                        }
                    });

                    console.error(`commit result for ${address}`);
                    this.listOfCommittedMarkets.push(address);
                } catch (e) {
                    console.error(e);
                }
            } else if (oracle === conf.sportOracleAddress && !this.listOfMarketsWithRequestedResult.includes(address)) {

                const resultRequested = await this.sendResultRequest(this.oracle_device_address, feed_name, address);

                if (resultRequested) {
                    this.listOfMarketsWithRequestedResult.push(address);
                }
            }
        };
    }
}

module.exports = ResultCommitter;