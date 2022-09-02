const { getActualMarketInfo } = require("./getActualMarketInfo");
const { getAllMarkets } = require("./getAllMarkets");
const { getTradeEventsByMarket } = require("./getTradeEventsByMarket");
const { getCloses } = require("./getCloses");
const { getMarketAssets } = require("./getMarketAssets");
const { getMarketParams } = require("./getMarketParams");
const { makeCloses } = require("./makeCloses");
const { refreshSymbols } = require("./refreshSymbols");
const { saveMarketAsset } = require("./saveMarketAsset");
const { saveMarketResult } = require("./saveMarketResult");
const { savePredictionMarket } = require("./savePredictionMarket");
const { saveReserveSymbol } = require("./saveReserveSymbol");
const { saveSymbolForAsset } = require("./saveSymbolForAsset");
const { saveTradeEvent } = require("./saveTradeEvent");
const { registerSymbols } = require("./registerSymbols");

module.exports = {
  saveMarketAsset,
  savePredictionMarket,
  saveSymbolForAsset,
  refreshSymbols,
  saveTradeEvent,
  getTradeEventsByMarket,
  getMarketParams,
  getMarketAssets,
  getCloses,
  makeCloses,
  getActualMarketInfo,
  saveMarketResult,
  saveReserveSymbol,
  getAllMarkets,
  registerSymbols
}