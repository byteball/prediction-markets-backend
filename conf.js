/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;
exports.webPort = null;

exports.webserverPort = 3003;
exports.testnet = process.env.testnet == "1";
exports.factory_aa = "DNANYYJQHBRI2TLZHBTBXTM7Z26P7PMO";
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.forward_aa = "E4BAASPOCW6WHXSUOY2XEKXKA42RRD5I";
exports.token_registry_aa_address = process.env.testnet ? "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ" : "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ";

console.error('finished server conf');