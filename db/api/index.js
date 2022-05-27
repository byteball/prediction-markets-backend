const { getActualMarketInfo } = require("./getActualMarketInfo");
const { getAllCategories } = require("./getAllCategories");
const { getAllTradeEventsByMarketAddress } = require("./getAllTradeEventsByMarketAddress");
const { getCandles } = require("./getCandles");
const { getCategoryByAddress } = require("./getCategoryByAddress");
const { getMarketParams } = require("./getMarketParams");
const { makeCandles } = require("./makeCandles");
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
  getAllCategories,
  getMarketParams,
  getCandles,
  makeCandles,
  getActualMarketInfo,
  getCategoryByAddress,
  saveMarketResult,
  saveReserveSymbol
}