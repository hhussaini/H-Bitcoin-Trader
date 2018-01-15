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

import * as GTT from 'gdax-trading-toolkit';
import { GDAXFeed } from "gdax-trading-toolkit/build/src/exchanges";
import { LiveBookConfig, LiveOrderbook, SkippedMessageEvent, TradeMessage } from "gdax-trading-toolkit/build/src/core";
import { Ticker } from "gdax-trading-toolkit/build/src/exchanges/PublicExchangeAPI";
import { CumulativePriceLevel } from "gdax-trading-toolkit/build/src/lib";
import { PlaceOrderMessage} from "gdax-trading-toolkit/build/src/core";
import { LiveOrder } from "gdax-trading-toolkit/build/src/lib";

// import { PlaceOrderMessage } from "gdax-trading-toolkit/build/src/core";
// import { LiveOrder } from "gdax-trading-toolkit/build/src/lib";



const product = 'BTC-USD';
const logger = GTT.utils.ConsoleLoggerFactory({ level: 'debug' });  //This is if you want to print alot of extra info regarding connecting
//const logger = GTT.utils.NullLogger;
const printOrderbook = GTT.utils.printOrderbook;
const printTicker = GTT.utils.printTicker;


process.env["PUSHBULLET_KEY"] = "o.XH73kjkvFYCruCmaAv4WccbokF3m3o9h"; //pushbullet shit
process.env["PUSHBULLET_DEVICE_ID"] = "ujxM567gZhcsjAiVsKnSTs";

const pusher = new GTT.utils.PushBullet(process.env.PUSHBULLET_KEY);
const deviceID = process.env.PUSHBULLET_DEVICE_ID;



process.env["GDAX_KEY"] = "b1e3d1d7b87f1ab4269b3e19a43c3f12";
process.env["GDAX_SECRET"] = "td5AZeSfDa5aflI6Fxn5CPPTXjVuIOWFiViTEy59pi5EHCnkESFnW4zjXVV8gl4ZEspYJ0dGpNpR+BL6Et6OLQ==";
process.env["GDAX_PASSPHRASE"] = "6n61v8c10vh";

const gdaxAPI = GTT.Factories.GDAX.DefaultAPI(logger);

let lastTradeSide: string = "SELL"; //this is to see whether to hold coins or buy/sell

let tradeVolume: number = 0;


let tradeCounter: number = 0;



let setBtcPrice: boolean = false;
let btcPrice: number;
let amountCashNow: number;
let amountCashWhenTraded: number;
let currentFee: number;
let tradeFee: number;
let overallFee: number;

GTT.Factories.GDAX.FeedFactory(logger, [product]).then((feed: GDAXFeed) => {
// Configure the live book object

    const config: LiveBookConfig = {
        product: product,
        logger: logger
    };
    const book = new LiveOrderbook(config);


    book.on('LiveOrderbook.snapshot', () => {
        logger.log('info', 'Snapshot received by LiveOrderbook Demo');

        // setInterval(() => {
        //     console.log(printOrderbook(book, 5));
        //     printOrderbookStats(book);
           
        //     logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);

        //     checkBook(book);
            
            
        // }, 3000);
    });
    book.on('LiveOrderbook.ticker', (ticker: Ticker) => {

        
        
        // console.log(printOrderbook(book, 5));
        // printOrderbookStats(book);
       
        // logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);

        // checkBook(book);
        console.log('THIS IS THE TICKERRRRRRRRR');
        console.log(printTicker(ticker));

        

    });
    book.on('LiveOrderbook.trade', (trade: TradeMessage) => {
        tradeVolume += +(trade.size);
    });

    book.on('LiveOrderbook.update', () => {
         console.log(printOrderbook(book, 5));
         printOrderbookStats(book);
         checkBook(book);
         
    });

    book.on('LiveOrderbook.skippedMessage', (details: SkippedMessageEvent) => {
        // On GDAX, this event should never be emitted, but we put it here for completeness
        console.log('SKIPPED MESSAGE', details);
        console.log('Reconnecting to feed');
        //feed.reconnect(0);
    });
    book.on('end', () => {
        console.log('Orderbook closed');
    });
    book.on('error', (err) => {
        console.log('Livebook errored: ', err);
        feed.pipe(book);
    });
    


    feed.pipe(book);
    
});

function printOrderbookStats(book: LiveOrderbook) {
    console.log(`Number of bids:       \t${book.numBids}\tasks: ${book.numAsks}`);
    console.log(`Total ${book.baseCurrency} liquidity: \t${book.bidsTotal.toFixed(3)}\tasks: ${book.asksTotal.toFixed(3)}`);
    let orders: CumulativePriceLevel[] = book.ordersForValue('buy', 1, false);
    console.log(`Cost of buying 1 ${book.baseCurrency}: ${orders[orders.length - 1].cumValue.toFixed(2)} ${book.quoteCurrency}`);
    orders = book.ordersForValue('sell', 1000, true);
    console.log(`Need to sell ${orders[orders.length - 1].cumSize.toFixed(3)} ${book.baseCurrency} to get 1000 ${book.quoteCurrency}`);
    console.log(`THE LAST THING YOU DID WAS ${lastTradeSide} AND YOU DID THIS MANY TRADES ${tradeCounter} `)
}



//Look at top 10 trades. volume being sold tells everything. mainly the first one. make a margin. if a large 
//amount is on the first of each, look at the first one only. Once the amounts scatter, freeze funds and wait for a large amount to again 
//come in one of the top spots.




function submitTrade(side: string, amount: string, price: string) {
    const order: PlaceOrderMessage = {
        type: 'order',
        time: null,
        productId: product,
        orderType: 'limit',
        side: side,
        size: amount,
        price: price
    };

    gdaxAPI.placeOrder(order).then((result: LiveOrder) => {
        console.log('Order executed', `Order to ${order.side} 0.1 placed. Result: ${result.status}`);
        pushMessage('Price Trigger', `Order to ${order.side} 0.1 placed. Result: ${result.status}`);
    });
}

function checkBook(book: LiveOrderbook){ //simple for now, only looking at top 2 values


    const state = book.state();
    
    const buying = state.bids[0];
    const selling = state.asks[0];
    
    const buyingSize = buying.totalSize.toNumber();   //how many people trying to buy
    const sellingSize = selling.totalSize.toNumber(); //how many people trying to sell
    
    const buyingPrice = buying.price.toNumber(); //will always be 1 cent apart 
    const sellingPrice = selling.price.toNumber();
    
    if (setBtcPrice == false){
        btcPrice = selling.price.toNumber();
        tradeFee = (0.10 * btcPrice) * 0.0025; //this is the traded time fee 
        setBtcPrice = true;
    }

    console.log(`THIS IS MY BTC ${btcPrice} AND IS BEING COMPARED TO ${sellingPrice}`);

    if ((btcPrice > sellingPrice) && lastTradeSide === "SELL"){

        amountCashNow = 0.10 * sellingPrice;
        amountCashWhenTraded = 0.10 * btcPrice;
        currentFee = amountCashNow * 0.0025;
        overallFee = tradeFee + currentFee;

        if ((amountCashWhenTraded - amountCashNow) >= (overallFee + 1)){

            console.log(`You bought .10 which is ${amountCashNow} because before you sold .10 which was ${amountCashWhenTraded} and you made ${amountCashWhenTraded - amountCashNow - overallFee} `);

            pushMessage('Price Trigger', `You bought .10 which is ${amountCashNow} because before you sold .10 which was ${amountCashWhenTraded} and you made ${amountCashWhenTraded - amountCashNow - overallFee}`);

            lastTradeSide = "BUY";
            setBtcPrice = false;
        }


    }
    else if ((btcPrice < sellingPrice) && lastTradeSide === "BUY"){ 

        amountCashNow = 0.10 * sellingPrice;
        amountCashWhenTraded = 0.10 * btcPrice;
        currentFee = amountCashNow * 0.0025;
        overallFee = tradeFee + currentFee;

        if ((amountCashNow - amountCashWhenTraded) >= (overallFee + 1)){
            
            console.log(`You sold .10 which is ${amountCashNow} because before you bought .10 which was ${amountCashWhenTraded} and you made ${amountCashNow - amountCashWhenTraded - overallFee} `);

            pushMessage('Price Trigger', `You sold .10 which is ${amountCashNow} because before you bought .10 which was ${amountCashWhenTraded} and you made ${amountCashNow - amountCashWhenTraded - overallFee}`);
            
            lastTradeSide = "SELL";
            setBtcPrice = false;
        }


        
    }





    const ratio = buyingSize/sellingSize; //leaving to avoid typescript errors for now

    if (buyingSize > 10000000){    //just for testing so typescript doesnt give errors
        submitTrade('buy', '0.02', '9237');
        console.log(printOrderbook(book, 5));
        printOrderbookStats(book);
       
        logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);

        checkBook(book);
    }

    console.log(`THIS IS SELLING:  ${sellingSize} AT ${sellingPrice} EACH \n THIS IS BUYING ${buyingSize} AT ${buyingPrice} EACH \n THIS IS RATIO ${ratio}`);
        
}






function pushMessage(title: string, msg: string): void {
    pusher.note(deviceID, title, msg, (err: Error, res: any) => {
        if (err) {
            logger.log('error', 'Push message failed', err);
            return;
        }
        logger.log('info', 'Push message result', res);
    });
}

    // function checkBuyTrade(buyMatchDate: number, buyMatch: boolean){  do later for now just copy and paste

    //     if (buyMatch == false && lastTradeSide === "SELL"){
    //         firstBuyMatchDate = Date.now();
    //         buyMatch = true;
    //     }

    //     if (buyMatch == true && lastTradeSide === "SELL"){
    //         if (Date.now() - firstBuyMatchDate > 3000){

    //             console.log(`CHECKING TIMES THE PAST ${firstBuyMatchDate} AND NOW ${Date.now()} EXECUTE TRADE NOW AFTER 3 SECONDS`);
    //             lastTradeSide = "BUY";
    //             buyMatch = false;
    //         }
    //     }

    // }