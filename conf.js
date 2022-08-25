/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;
exports.webPort = null;

exports.webserverPort = process.env.testnet ? 5001 : 5000;
exports.testnet = process.env.testnet == "1";
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.tokenRegistryAaAddress = "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ";

exports.bSingleAddress = true;
exports.bWantNewPeers = true;

// custom
exports.factoryAas = ["S6WVQ6JQCNQ27OQJM2IQDS6DYTKBM24G", "ZV3JPT2RDDQSEFTO7IDOZF3OWVUZF7NC"];
exports.deviceName = 'Prediction markets';
exports.enableCommitter = false;
exports.supportedReserveAssets = process.env.testnet == "1" ? {
  base: {
    symbol: "GBYTE",
    decimals: 9
  },
  'lwvZjepKoGSiMIDalxi2GB8Pd+nK86Qsnsn1Ng7TAJE=': {
    symbol: "USDC3",
    decimals: 4
  }
} : {
  base: {
    symbol: "GBYTE",
    decimals: 9
  },
  'S/oCESzEO8G2hvQuI6HsyPr0foLfKwzs+GU73nO9H40=': {
    symbol: "USDC",
    decimals: 4
  }
};
exports.webUrl = process.env.testnet ? 'https://testnet.prophet.ooo/api' : 'https://prophet.ooo/api';
exports.footballDataApiKey = process.env.footballDataApiKey;
exports.sportOracleAddress = process.env.testnet === '1' ? 'MDKKPO375Q5M3GDET2X4H4ZNSO37OIIZ' : 'TKT4UESIKTTRALRRLWS4SENSTJX6ODCW';
exports.sportOraclePairingCode = process.env.testnet ? 'AozzzS0drYyXGk2Hj1jJ0IV4FL6zykUAYdmygfMw1gsO@obyte.org/bb-test#0000' : 'Ar1O7dGgkkcABYNAbShlY2Pbx6LmUzoyRh6F14vM0vTZ@obyte.org/bb#0000';
exports.currencyOracleAddresses = process.env.testnet ? ['F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N'] : ['JPQKPRI5FMTQRJF4ZZMYZYDQVRD55OTC', 'DXYWHSZ72ZDNDZ7WYZXKWBBH425C6WZN'];
exports.limitMarketsOnPage = 5;
exports.factoryUpgradeTimestamp = 1660221260;

console.error('finished server conf');