const { getAllCategories } = require("./getAllCategories");
const { getAllTradeEventsByMarketAddress } = require("./getAllTradeEventsByMarketAddress");
const { getMarketParams } = require("./getMarketParams");
const { refreshSymbols } = require("./refreshSymbols");
const { saveMarketAsset } = require("./saveMarketAsset");
const { savePredictionMarket } = require("./savePredictionMarket");
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
  getMarketParams
}