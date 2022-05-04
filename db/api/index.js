const { refreshSymbols } = require("./refreshSymbols");
const { saveMarketAsset } = require("./saveMarketAsset");
const { savePredictionMarket } = require("./savePredictionMarket");
const { saveSymbolForAsset } = require("./saveSymbolForAsset");

module.exports = {
  saveMarketAsset: saveMarketAsset,
  savePredictionMarket: savePredictionMarket,
  saveSymbolForAsset: saveSymbolForAsset,
  refreshSymbols: refreshSymbols
}