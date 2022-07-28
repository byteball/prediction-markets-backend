const wallet_general = require('ocore/wallet_general.js');
const dag = require('aabot/dag.js');
const clc = require("cli-color");
const { bind } = require('lodash');
const operator = require('aabot/operator.js');

const marketDB = require('./db');

const CHECK_INTERVAL = 1000 * 60 * 10; // 10 min

class ResultCommitter {
    constructor() {
        this.intervalId = null;
    }

    async init() {
        await wallet_general.readMyPersonalAddresses(async ([address]) => {
            if (!address) throw "no address, please check conf.js";

            const balance = await dag.readBalance(address);

            this.balance = balance?.base?.stable || 0;

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
        });

        await operator.start();

        this.intervalId = setInterval(bind(this.checkAndCommit, this), CHECK_INTERVAL);
    }

    async checkAndCommit() {
        const markets = await marketDB.api.getAllMarkets({ waitingResult: true });

        const dataFeedsGetters = markets.map(({ oracle, feed_name, aa_address }) => dag.getDataFeed(oracle, feed_name).then((value) => ({ address: aa_address, value })).catch(() => ({ address: aa_address, value: null })))

        const dataFeeds = await Promise.all(dataFeedsGetters);

        dataFeeds.forEach(async ({ address, value }) => {
            if (value !== null) {
                try {

                    dag.sendPayment({
                        to_address: address,
                        amount: 1e4,
                        data: {
                            commit: 1
                        }
                    });

                    console.error(`commit result for ${address}`);
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }
}

module.exports = ResultCommitter;