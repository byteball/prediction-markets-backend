/*jslint node: true */
"use strict";
exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;
// exports.webPort = null;

exports.testnet = process.env.testnet == "1";
exports.factory_aa = "AQG6CW6UWKU5ZWA45NQLAJKBRN2AUAEE";
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';