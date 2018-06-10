"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bittrex = require("node.bittrex.api");
const types_1 = require("../../lib/types");
const BookBuilder_1 = require("../../lib/BookBuilder");
class BittrexAPI {
    static normalizeProduct(gdaxProduct) {
        const [base, quote] = gdaxProduct.split('-');
        return `${quote}-${base}`;
    }
    constructor(auth, logger) {
        this.owner = 'Bittrex';
        this.logger = logger;
        Bittrex.options({
            apikey: auth.key || 'APIKEY',
            apisecret: auth.secret || 'APISECRET',
            inverse_callback_arguments: true,
            stream: false,
            cleartext: false,
            verbose: false
        });
    }
    loadProducts() {
        return new Promise((resolve, reject) => {
            Bittrex.getmarkets((err, data) => {
                if (err) {
                    return reject(err);
                }
                if (!data.success || !data.result) {
                    return reject(new Error('Unexpected response from Bittrex: ' + JSON.stringify(data)));
                }
                const result = data.result.map((market) => {
                    return {
                        id: market.MarketName,
                        sourceId: market.MarketName,
                        baseCurrency: market.BaseCurrency,
                        quoteCurrency: market.marketCurrency,
                        baseMinSize: types_1.Big(market.MinTradeSize),
                        baseMaxSize: types_1.Big('1e18'),
                        quoteIncrement: types_1.Big(market.MinTradeSize),
                        sourceData: market
                    };
                });
                return resolve(result);
            });
        });
    }
    loadMidMarketPrice(gdaxProduct) {
        return this.loadTicker(gdaxProduct).then((ticker) => {
            return ticker.bid.plus(ticker.ask).times(0.5);
        });
    }
    loadOrderbook(gdaxProduct) {
        const product = BittrexAPI.normalizeProduct(gdaxProduct);
        return new Promise((resolve, reject) => {
            Bittrex.getorderbook({
                market: product,
                type: 'both',
                depth: 5000
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                if (!data.success || !data.result) {
                    return reject(new Error('Unexpected response from Bittrex: ' + JSON.stringify(data)));
                }
                const bids = data.result.buy;
                const asks = data.result.sell;
                const book = new BookBuilder_1.BookBuilder(this.logger);
                bids.forEach((order) => {
                    book.add({
                        id: order.Rate,
                        price: types_1.Big(order.Rate),
                        size: types_1.Big(order.Quantity),
                        side: 'buy'
                    });
                });
                asks.forEach((order) => {
                    book.add({
                        id: order.Rate,
                        price: types_1.Big(order.Rate),
                        size: types_1.Big(order.Quantity),
                        side: 'sell'
                    });
                });
                return resolve(book);
            });
        });
    }
    loadTicker(gdaxProduct) {
        const product = BittrexAPI.normalizeProduct(gdaxProduct);
        return new Promise((resolve, reject) => {
            Bittrex.getticker({ market: product }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                if (!data.success || !data.result) {
                    return reject(new Error('Unexpected response from Bittrex: ' + JSON.stringify(data)));
                }
                const result = {
                    productId: gdaxProduct,
                    ask: types_1.Big(data.result.Ask),
                    bid: types_1.Big(data.result.Bid),
                    price: types_1.Big(data.result.Last),
                    time: new Date()
                };
                return resolve(result);
            });
        });
    }
    placeOrder(order) {
        throw new Error('Method not implemented.');
    }
    cancelOrder(id) {
        throw new Error('Method not implemented.');
    }
    cancelAllOrders(product) {
        throw new Error('Method not implemented.');
    }
    loadOrder(id) {
        throw new Error('Method not implemented.');
    }
    loadAllOrders(gdaxProduct) {
        throw new Error('Method not implemented.');
    }
    loadBalances() {
        throw new Error('Method not implemented.');
    }
}
exports.BittrexAPI = BittrexAPI;
//# sourceMappingURL=BittrexAPI.js.map