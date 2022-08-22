const { getActualMarketInfo } = require("./getActualMarketInfo");
const { getAllMarkets } = require("./getAllMarkets");
const { getAllTradeEventsByMarketAddress } = require("./getAllTradeEventsByMarketAddress");
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

module.exports = {
  saveMarketAsset,
  savePredictionMarket,
  saveSymbolForAsset,
  refreshSymbols,
  saveTradeEvent,
  getAllTradeEventsByMarketAddress,
  getMarketParams,
  getMarketAssets,
  getCloses,
  makeCloses,
  getActualMarketInfo,
  saveMarketResult,
  saveReserveSymbol,
  getAllMarkets
}