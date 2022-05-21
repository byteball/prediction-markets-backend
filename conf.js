/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;
exports.webPort = null;

exports.webserverPort = 3005;
exports.testnet = process.env.testnet == "1";
exports.factory_aa = "X57IVRKVCRTBZM6KMYL6RCRG4P4MWJZN";
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.forward_aa = "E4BAASPOCW6WHXSUOY2XEKXKA42RRD5I";
exports.token_registry_aa_address = process.env.testnet ? "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ" : "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ";

exports.supported_reserve_assets = process.env.testnet == "1" ? {
  GBYTE: 'base',
  ETH: 'tZgXWTAv+1v1Ow4pMEVFFNlZAobGxMm2kIcr2dVR68c=',
  USDC: 'lwvZjepKoGSiMIDalxi2GB8Pd+nK86Qsnsn1Ng7TAJE='
} : {};

console.error('finished server conf');