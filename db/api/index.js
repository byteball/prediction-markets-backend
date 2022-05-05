const { getAllTradeEventsByMarketAddress } = require("./getAllTradeEventsByMarketAddress");
const { refreshSymbols } = require("./refreshSymbols");
const { saveMarketAsset } = require("./saveMarketAsset");
const { savePredictionMarket } = require("./savePredictionMarket");
const { saveSymbolForAsset } = require("./saveSymbolForAsset");
const { saveTradeEvent } = require("./saveTradeEvent");

module.exports = {
  saveMarketAsset: saveMarketAsset,
  savePredictionMarket: savePredictionMarket,
  saveSymbolForAsset: saveSymbolForAsset,
  refreshSymbols: refreshSymbols,
  saveTradeEvent: saveTradeEvent,
  getAllTradeEventsByMarketAddress: getAllTradeEventsByMarketAddress
}