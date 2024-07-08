const { getActualMarketInfo } = require("./getActualMarketInfo");
const { saveMarketVenue } = require("./saveMarketVenue");
const { getAllMarkets } = require("./getAllMarkets");
const { getTradeEventsByMarket } = require("./getTradeEventsByMarket");
const { getCandles } = require("./getCandles");
const { getMarketAssets } = require("./getMarketAssets");
const { getMarketParams } = require("./getMarketParams");
const { makeCandles } = require("./makeCandles");
const { refreshSymbols } = require("./refreshSymbols");
const { saveMarketAsset } = require("./saveMarketAsset");
const { saveMarketResult } = require("./saveMarketResult");
const { savePredictionMarket } = require("./savePredictionMarket");
const { saveReserveSymbol } = require("./saveReserveSymbol");
const { saveSymbolForAsset } = require("./saveSymbolForAsset");
const { saveTradeEvent } = require("./saveTradeEvent");
const { registerSymbols } = require("./registerSymbols");
const { updateOdds } = require("./updateOdds");
const { getBookmakerOddsByFeedName } = require("./getBookmakerOddsByFeedName");
const { getVenue } = require("./getVenue");

module.exports = {
  saveMarketAsset,
  saveMarketVenue,
  savePredictionMarket,
  saveSymbolForAsset,
  refreshSymbols,
  saveTradeEvent,
  getTradeEventsByMarket,
  getMarketParams,
  getMarketAssets,
  getCandles,
  makeCandles,
  getActualMarketInfo,
  saveMarketResult,
  saveReserveSymbol,
  getAllMarkets,
  registerSymbols,
  updateOdds,
  getBookmakerOddsByFeedName,
  getVenue
}