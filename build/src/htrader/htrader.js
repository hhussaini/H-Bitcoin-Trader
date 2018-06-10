"use strict";
/***************************************************************************************************************************
 * @license                                                                                                                *
 * Copyright 2017 Coinbase, Inc.                                                                                           *
 *                                                                                                                         *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance          *
 * with the License. You may obtain a copy of the License at                                                               *
 *                                                                                                                         *
 * http://www.apache.org/licenses/LICENSE-2.0                                                                              *
 *                                                                                                                         *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on     *
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the                      *
 * License for the specific language governing permissions and limitations under the License.                              *
 ***************************************************************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const GTT = require("gdax-trading-toolkit");
const types_1 = require("gdax-trading-toolkit/build/src/lib/types");
const exchanges_1 = require("gdax-trading-toolkit/build/src/exchanges");
const GDAXExchangeAPI_1 = require("gdax-trading-toolkit/build/src/exchanges/gdax/GDAXExchangeAPI");
const logger = GTT.utils.ConsoleLoggerFactory();
const product = 'ETH-USD';
/**
 * Remember to set GDAX_KEY, GDAX_SECRET and GDAX_PASSPHRASE envars to allow trading
 */
const gdaxAPI = GTT.Factories.GDAX.DefaultAPI(logger);
const [base, quote] = product.split('-');
const spread = types_1.Big('0.15');
const options = {
    logger: logger,
    auth: { key: null, secret: null, passphrase: null },
    channels: ['ticker'],
    wsUrl: exchanges_1.GDAX_WS_FEED,
    apiUrl: GDAXExchangeAPI_1.GDAX_API_URL
};
GTT.Factories.GDAX.getSubscribedFeeds(options, [product]).then((feed) => {
    GTT.Core.createTickerTrigger(feed, product)
        .setAction((ticker) => {
        const currentPrice = ticker.price;
        GTT.Core.createPriceTrigger(feed, product, currentPrice.minus(spread))
            .setAction((event) => {
            console.log('Price Trigger', `${base} price has fallen and is now ${event.price} ${quote} on ${product} on GDAX`);
            submitTrade('buy', '0.01');
        });
        GTT.Core.createPriceTrigger(feed, product, currentPrice.plus(spread))
            .setAction((event) => {
            console.log('Price Trigger', `${base} price has risen and is now ${event.price} ${quote} on ${product} on GDAX`);
            submitTrade('sell', '0.01');
        });
    });
    GTT.Core.createTickerTrigger(feed, product, false)
        .setAction((ticker) => {
        console.log(GTT.utils.printTicker(ticker, 3));
    });
});
function submitTrade(side, amount) {
    const order = {
        type: 'order',
        time: null,
        productId: product,
        orderType: 'market',
        side: side,
        size: amount
    };
    gdaxAPI.placeOrder(order).then((result) => {
        console.log('Order executed', `Order to ${order.side} 0.1 ${base} placed. Result: ${result.status}`);
    });
}
//# sourceMappingURL=htrader.js.map