"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./FXService"));
__export(require("./FXRateCalculator"));
__export(require("./FXProvider"));
const CoinMarketCapProvider = require("./providers/CoinMarketCapProvider");
const OpenExchangeProvider = require("./providers/OpenExchangeProvider");
const YahooFXProvider = require("./providers/YahooFXProvider");
exports.Providers = {
    CoinMarketCapProvider,
    OpenExchangeProvider,
    YahooFXProvider
};
const SimpleRateCalculator_1 = require("./calculators/SimpleRateCalculator");
exports.Calculators = {
    SimpleRateCalculator: SimpleRateCalculator_1.default
};
//# sourceMappingURL=index.js.map