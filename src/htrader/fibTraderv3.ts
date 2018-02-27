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
import { PlaceOrderMessage, StreamMessage, TradeFinalizedMessage, TradeExecutedMessage, OrderDoneMessage} from "gdax-trading-toolkit/build/src/core";
import { LiveOrder } from "gdax-trading-toolkit/build/src/lib";


// import { PlaceOrderMessage } from "gdax-trading-toolkit/build/src/core";
// import { LiveOrder } from "gdax-trading-toolkit/build/src/lib";



const product = 'BTC-USD';
const logger = GTT.utils.ConsoleLoggerFactory({ level: 'debug' });  //This is if you want to print alot of extra info regarding connecting
//const logger = GTT.utils.NullLogger;
const printOrderbook = GTT.utils.printOrderbook;
//const printTicker = GTT.utils.printTicker;


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


let difference5Min: number = 0;
let difference15Min: number = 0;
let difference30Min: number = 0;
let difference1Hour: number = 0;

let ret2FiveMin: number;
let ret5FiveMin: number;
let ext5FiveMin: number;

let ret2FifteenMin: number;
let ret5FifteenMin: number;
let ext5FifteenMin: number;

let ret2ThirtyMin: number;
let ret5ThirtyMin: number;
let ext5ThirtyMin: number;

let ret2OneHour: number;
let ret5OneHour: number;
let ext5OneHour: number;



let high5: number = 0; //important stuff
let low5: number = 99999;
let open5: number = 0;
let open5Boolean: boolean = false;
let close5: number = 0;
let global5MinuteCounter: number = Date.now();


let high15: number = 0; //important stuff
let low15: number = 99999;
let open15: number = 0;
let open15Boolean: boolean = false;
let close15: number = 0;
let global15MinuteCounter: number = Date.now();


let high30: number = 0; //important stuff
let low30: number = 99999;
let open30: number = 0;
let open30Boolean: boolean = false;
let close30: number = 0;
// let global30MinuteCounter: number = Date.now();



let high1Hour: number = 0; //important stuff
let low1Hour: number = 99999;
let open1Hour: number = 0;
let open1HourBoolean: boolean = false;
let close1Hour: number = 0;
// let global1HourCounter: number = Date.now();


//VERY IMPORTANT LiveOrders are the INITIAL order of each set
//PlaceOrderMessages are the FOLLOWING in the set that will only occur when the initial liveOrder is done 
let initialOrder38FiveMin: LiveOrder = null;
let initialOrder10FiveMin: Array<string> = [];
let initialOrder100FiveMin: LiveOrder = null;

let followingOrder38FiveMin: PlaceOrderMessage;
//let followingOrder10FiveMin: PlaceOrderMessage;



let initialOrder38FifteenMin: LiveOrder = null;
let initialOrder10FifteenMin: Array<string> = [];
let initialOrder100FifteenMin: LiveOrder = null;

let followingOrder38FifteenMin: PlaceOrderMessage;
//let followingOrder10FifteenMin: PlaceOrderMessage;



// let initialOrder38ThirtyMin: LiveOrder = null;
// let initialOrder10ThirtyMin: LiveOrder = null;
// let initialOrder100ThirtyMin: LiveOrder = null;

// let followingOrder38ThirtyMin: PlaceOrderMessage;
// let followingOrder10ThirtyMin: PlaceOrderMessage;


// let initialOrder38OneHour: LiveOrder = null;
// let initialOrder10OneHour: LiveOrder = null;
// let initialOrder100OneHour: LiveOrder = null;

// let followingOrder38OneHour: PlaceOrderMessage;
// let followingOrder10OneHour: PlaceOrderMessage;




let tradeFinalized: TradeFinalizedMessage;
let tradeExecuted: TradeExecutedMessage;
let orderDone: OrderDoneMessage;



let initial10ExecutedBool5: boolean = false;
let initial10ExecutedBool15: boolean = false;
let cancelled: boolean = false;



let fiveMinuteOrders: Array<string> = [];
let fifteenMinuteOrders: Array<string> = [];

// let fiveMinuteOrdersMap: { [key:string]: string; } = {};
// let fifteenMinuteOrdersMap: { [key:string]: string; } = {};

let initial10Triggered5: boolean = false;
let initial10Triggered15: boolean = false;

let initial10Close5: boolean = false;
let initial10Close15: boolean = false;

let bigCandle5: boolean = false;
let bigCandle15: boolean = false;

let initial10TradeSide5: string = "";
let initial10TradeSide15: string = "";

let fiveMinuteOrdersKeep: Array<string> = [];
let fifteenMinuteOrdersKeep: Array<string> = [];

let initialOrderFiveMinKeep: Array<string> = [];
let initialOrderFifteenMinKeep: Array<string> = [];

let fiveMinKeep: boolean = false;
let fifteenMinKeep: boolean = false;

let initialOrder38FiveMinKeep: LiveOrder = null;
let followingOrder38FiveMinKeep: PlaceOrderMessage;

let initialOrder38FifteenMinKeep: LiveOrder = null;
let followingOrder38FifteenMinKeep: PlaceOrderMessage;

let fiveMinuteInitialTradeCounter: number = 0;
let fifteenMinuteInitialTradeCounter: number = 0;

//let fiveMinuteAmountToTrade: number = 0;
//let fifteenMinuteAmountToTrade: number = 0;

let candleAverage5Minutes: number = 0;
let candleAverage15Minutes: number = 0;

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
       
        //console.log(printTicker(ticker));

        

    });
    book.on('LiveOrderbook.trade', (trade: TradeMessage) => {
        tradeVolume += +(trade.size);
    });

    book.on('LiveOrderbook.update', () => {
         //console.log(printOrderbook(book, 5));
         //printOrderbookStats(book);
         checkBook(book);
    });

    book.on('LiveOrderbook.skippedMessage', (details: SkippedMessageEvent) => {
        // On GDAX, this event should never be emitted, but we put it here for completeness
        console.log('SKIPPED MESSAGE', details);
        //console.log('Reconnecting to feed');
        //feed.reconnect(0); //this messes everything up, keep commented out
    });
    book.on('end', () => {
        console.log('Orderbook closed');
    });
    book.on('error', (err) => {
        console.log('Livebook errored: ', err);
        feed.pipe(book);
    });
    
    feed.on('data', (msg: StreamMessage) => {


        if (msg.type === 'tradeExecuted'){
            
            tradeExecuted = msg as TradeExecutedMessage;

            if (fiveMinuteOrders.includes(tradeExecuted.orderId)){
                fiveMinuteOrders.splice(fiveMinuteOrders.indexOf(tradeExecuted.orderId), 1);
            }
            if (fifteenMinuteOrders.includes(tradeExecuted.orderId)){
                fifteenMinuteOrders.splice(fifteenMinuteOrders.indexOf(tradeExecuted.orderId), 1);
            }

            if (fiveMinuteOrdersKeep.includes(tradeExecuted.orderId)){
                fiveMinuteOrdersKeep.splice(fiveMinuteOrdersKeep.indexOf(tradeExecuted.orderId), 1);
            }
            if (fifteenMinuteOrdersKeep.includes(tradeExecuted.orderId)){
                fifteenMinuteOrdersKeep.splice(fifteenMinuteOrdersKeep.indexOf(tradeExecuted.orderId), 1);
            }

            if (initialOrder38FiveMin != null){
                if (tradeExecuted.orderId == initialOrder38FiveMin.id){
                    console.log(`Initial Order 38 5 Minutes to ${tradeExecuted.side} at ${initialOrder38FiveMin.price} was completed`);
                    gdaxAPI.placeOrder(followingOrder38FiveMin).then((result: LiveOrder) => {
                        fiveMinuteOrders.push(result.id);
                        console.log('Order executed', `FOLLOWING Order to ${followingOrder38FiveMin.side} 0.005 at ${followingOrder38FiveMin.price} placed. Result: ${result.status}`);
                        pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder38FiveMin.side} 0.005 at ${followingOrder38FiveMin.price} placed. Result: ${result.status}`);
                    });
                }
            }
            if (initialOrder10FiveMin.includes(tradeExecuted.orderId)){
                console.log(`Initial Order 10 5 Minutes to ${tradeExecuted.side} was completed`);
                initialOrder10FiveMin.splice(initialOrder10FiveMin.indexOf(tradeExecuted.orderId), 1);
                initial10ExecutedBool5 = true;
                initial10TradeSide5 = tradeExecuted.side;
                if (initialOrderFiveMinKeep.includes(tradeExecuted.orderId)){
                    fiveMinKeep = true;
                }
                fiveMinuteInitialTradeCounter++;
                console.log("COUNTER" + fiveMinuteInitialTradeCounter);
            }
            if (initialOrder38FiveMinKeep != null){
                if (tradeExecuted.orderId == initialOrder38FiveMinKeep.id){
                    console.log(`Initial Order 38 5 Minutes Keep to ${tradeExecuted.side} at ${initialOrder38FiveMinKeep.price} was completed`);
                    gdaxAPI.placeOrder(followingOrder38FiveMinKeep).then((result: LiveOrder) => {
                        fiveMinuteOrdersKeep.push(result.id);
                        console.log('Order executed', `FOLLOWING keep Order to ${followingOrder38FiveMinKeep.side} 0.005 at ${followingOrder38FiveMinKeep.price} placed. Result: ${result.status}`);
                        pushMessage('Price Trigger', `FOLLOWING keep Order to ${followingOrder38FiveMinKeep.side} 0.005 at ${followingOrder38FiveMinKeep.price} placed. Result: ${result.status}`);
                    });
                }
            }

            
            if (initialOrder38FifteenMin != null){
                if (tradeExecuted.orderId == initialOrder38FifteenMin.id){
                    console.log(`Initial Order 38 15 Minutes to ${tradeExecuted.side} at ${initialOrder38FifteenMin.price} was completed`);
                    gdaxAPI.placeOrder(followingOrder38FifteenMin).then((result: LiveOrder) => {
                        fifteenMinuteOrders.push(result.id);
                        console.log('Order executed', `FOLLOWING Order to ${followingOrder38FifteenMin.side} 0.005 at ${followingOrder38FifteenMin.price} placed. Result: ${result.status}`);
                        pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder38FifteenMin.side} 0.005 at ${followingOrder38FifteenMin.price} placed. Result: ${result.status}`);
                    });
                }
            }
            if (initialOrder10FifteenMin.includes(tradeExecuted.orderId)){
                console.log(`Initial Order 10 15 Minutes to ${tradeExecuted.side} was completed`);
                initialOrder10FifteenMin.splice(initialOrder10FifteenMin.indexOf(tradeExecuted.orderId), 1);
                initial10ExecutedBool15 = true;
                initial10TradeSide15 = tradeExecuted.side;
                if (initialOrderFifteenMinKeep.includes(tradeExecuted.orderId)){
                    fifteenMinKeep = true;
                }
                fifteenMinuteInitialTradeCounter++;
            }
            if (initialOrder38FifteenMinKeep != null){
                if (tradeExecuted.orderId == initialOrder38FifteenMinKeep.id){
                    console.log(`Initial Order 38 15 Minutes Keep to ${tradeExecuted.side} at ${initialOrder38FifteenMinKeep.price} was completed`);
                    gdaxAPI.placeOrder(followingOrder38FifteenMinKeep).then((result: LiveOrder) => {
                        fifteenMinuteOrdersKeep.push(result.id);
                        console.log('Order executed', `FOLLOWING keep Order to ${followingOrder38FifteenMinKeep.side} 0.005 at ${followingOrder38FifteenMinKeep.price} placed. Result: ${result.status}`);
                        pushMessage('Price Trigger', `FOLLOWING keep Order to ${followingOrder38FifteenMinKeep.side} 0.005 at ${followingOrder38FifteenMinKeep.price} placed. Result: ${result.status}`);
                    });
                }
            }

            
        }
    

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







function submitTrade(side: string, amount: string, price: string, percentAndMin: string) {

    const order: PlaceOrderMessage = {
        type: 'placeOrder',
        time: new Date(),
        productId: product,
        orderType: 'limit',
        side: side,
        size: amount,
        price: price,
        postOnly: true
    };

    

    gdaxAPI.placeOrder(order).then((result: LiveOrder) => {
        
        if (percentAndMin === '10.0 5 Minutes'){
            initialOrder10FiveMin.push(result.id);
            fiveMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '38.2 5 Minutes'){
            if (fiveMinKeep == true){
                initialOrder38FiveMinKeep = result;
                fiveMinuteOrdersKeep.push(result.id);
            }
            else{
                initialOrder38FiveMin = result;
                fiveMinuteOrders.push(result.id);
            }
        }
        else if (percentAndMin === '100 5 Minutes'){
            if (fiveMinKeep == true){
                fiveMinuteOrdersKeep.push(result.id);
            }
            else{
                initialOrder100FiveMin = result;
                fiveMinuteOrders.push(result.id);
            }
        }
        else if (percentAndMin === 'Following Order 10.0 5 Minutes'){
            fiveMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '10.0 5 Minutes Keep'){
            fiveMinuteOrders.push(result.id);
            initialOrder10FiveMin.push(result.id);
            initialOrderFiveMinKeep.push(result.id);
        }


        else if (percentAndMin === '10.0 15 Minutes'){
            initialOrder10FifteenMin.push(result.id);
            fifteenMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '38.2 15 Minutes'){
            if (fifteenMinKeep == true){
                initialOrder38FifteenMinKeep = result;
                fifteenMinuteOrdersKeep.push(result.id);
            }
            else{
                initialOrder38FifteenMin = result;
                fifteenMinuteOrders.push(result.id);
            }
            
        }
        else if (percentAndMin === '100 15 Minutes'){
            if (fifteenMinKeep == true){
                initialOrder100FifteenMin = result;
                fifteenMinuteOrdersKeep.push(result.id);
            }
            else{
                initialOrder100FifteenMin = result;
                fifteenMinuteOrders.push(result.id);
            }
            
        }
        else if (percentAndMin === 'Following Order 10.0 15 Minutes'){
            fifteenMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '10.0 15 Minutes Keep'){
            fifteenMinuteOrders.push(result.id);
            initialOrder10FifteenMin.push(result.id);
            initialOrderFifteenMinKeep.push(result.id);
        }


        console.log('Order executed', `INITIAL Order to ${order.side} 0.005 placed. Result: ID OF ${percentAndMin} is ${result.id} ${result.status}`);
        pushMessage('Price Trigger', `INITIAL Order to ${order.side} 0.005 placed. Result: ID OF ${percentAndMin} is ${result.id} ${result.status}`);
    });

    
}




function checkBook(book: LiveOrderbook){ 


    if (Date.now() - global5MinuteCounter < 300000){

        const state = book.state(); 
        
        const buying = state.bids[0];
        const selling = state.asks[0];
        
        const buyingSize = buying.totalSize.toNumber();   //how many people trying to buy
        const sellingSize = selling.totalSize.toNumber(); //how many people trying to sell
        
        const buyingPrice = buying.price.toNumber(); //will always be 1 cent apart 
        const sellingPrice = selling.price.toNumber();
        
        if (high5 < sellingPrice){   //getting candlestick numbers
            high5 = sellingPrice;     
        }
        if (low5 > sellingPrice){     
            low5 = sellingPrice;
        }
        if (open5Boolean == false){ 
            open5 = sellingPrice;
            open5Boolean = true;
        }

        if (initial10Close5 == false){
            close5 = sellingPrice;
        }
        

        if (initial10Triggered5 == false){
            initial10Triggered5 = true;

            // let start = new Date();
            // start.setHours(start.getHours() - 5);
            
            // let end = new Date();
            
            //start.setTime( start.getTime() - 300*60*1000 );
            //end.setTime( end.getTime() - 300*60*1000 );


            // let isoStart = start.toISOString();
            // let isoEnd = end.toISOString();

            // let isoStart = start.toISOString().slice(0, -1);
            // let isoEnd = end.toISOString().slice(0, -1);
            // isoStart = isoStart.concat('-05:00');
            // isoEnd = isoEnd.concat('-05:00');
            //isoStart = '2018-02-11T17:26:58.696Z';
            //isoEnd = '2018-02-11T22:26:58.697Z';
            //let isoStart = start.toUTCString();
            //let isoEnd = end.toUTCString();
            // console.log("start " + isoStart);
            // console.log("end " + isoEnd);

            let options = {
                granularity: '300'
            };
            gdaxAPI.loadHistoricRates(options).then((res: Array<Array<string>>) => {
                //console.log(res);               
                //console.log("LEN: " + res.length); will always be 350(max) currently
                let numArray = new Array(31).fill(0);
                let average = 0;
                let averageCounter = 0;
                for (let i = 0; i < 121; i++){ //hardcoded for 10 hours. 12 * amount of hours to look at 
                    let open = Number(res[i][3]);
                    let close = Number(res[i][4]);
                    //console.log("VAL: " + Math.abs(open - close));
                    if (Math.abs(open - close) > 40){    //everything above 40 because 5 minute candles arent so big
                        average += Math.abs(open - close);
                        averageCounter++;
                        //console.log("AVG: " + average);
                        if (Math.abs(open - close) < 100){
                            let tens = Math.floor((Math.abs(open - close)/10) % 10);
                            numArray[tens]++;
                        }
                        else if (Math.abs(open - close) >= 100){
                            let hundreds = Math.floor((Math.abs(open - close)/10));
                            numArray[hundreds]++;
                        }

                    }
                  
                }
                let finalAverage = average/averageCounter;
                console.log("FINAL AVERAGE: " + finalAverage);

                let newAverageTotal = 0;
                let newCounter = 0;

                
                for (let j = 0; j < numArray.length; j++){
                    //console.log("FILLED ARRAY: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
                    if (numArray[j] > 0){
                        newAverageTotal += (numArray[j] * (j*10));
                        newCounter += numArray[j];
                    }
                }

                candleAverage5Minutes = newAverageTotal/newCounter;
                console.log("NEW AVERAGE: " + newAverageTotal/newCounter);

                let buy10Five: number = open5 - (candleAverage5Minutes-10);
                let sell10Five: number = open5 + (candleAverage5Minutes-10);
                submitTrade('buy', '0.001', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                submitTrade('sell', '0.001', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - candleAverage5Minutes;
                sell10Five = open5 + candleAverage5Minutes;
                submitTrade('buy', '0.001', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                submitTrade('sell', '0.001', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - (candleAverage5Minutes+10);
                sell10Five = open5 + (candleAverage5Minutes+10);
                submitTrade('buy', '0.001', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                submitTrade('sell', '0.001', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - (candleAverage5Minutes+25);
                sell10Five = open5 + (candleAverage5Minutes+25);
                submitTrade('buy', '0.001', buy10Five.toFixed(2).toString(), '10.0 5 Minutes Keep');
                submitTrade('sell', '0.001', sell10Five.toFixed(2).toString(), '10.0 5 Minutes Keep');
                
            });


            
        }




        if (high15 < sellingPrice){   //getting candlestick numbers
            high15 = sellingPrice;     
        }
        if (low15 > sellingPrice){     
            low15 = sellingPrice;
        }
        if (open15Boolean == false){ 
            open15 = sellingPrice;
            open15Boolean = true;
        }

        if (initial10Close15 == false){
            close15 = sellingPrice;
        }
        

        if (initial10Triggered15 == false){
            initial10Triggered15 = true;

            let options = {
                granularity: '900'
            };
            gdaxAPI.loadHistoricRates(options).then((res: Array<Array<string>>) => {
                //console.log(res);               
                //console.log("LEN: " + res.length); will always be 350(max) currently
                let numArray = new Array(31).fill(0);
                let average = 0;
                let averageCounter = 0;
                for (let i = 0; i < 97; i++){ //hardcoded for 10 hours. 12 * amount of hours to look at 
                    let open = Number(res[i][3]);
                    let close = Number(res[i][4]);
                    //console.log("VAL: " + Math.abs(open - close));
                    if (Math.abs(open - close) > 60){    //everything above 40 because 5 minute candles arent so big
                        average += Math.abs(open - close);
                        averageCounter++;
                        //console.log("AVG: " + average);
                        if (Math.abs(open - close) < 100){
                            let tens = Math.floor((Math.abs(open - close)/10) % 10);
                            numArray[tens]++;
                        }
                        else if (Math.abs(open - close) >= 100){
                            let hundreds = Math.floor((Math.abs(open - close)/10));
                            numArray[hundreds]++;
                        }

                    }
                  
                }
                let finalAverage = average/averageCounter;
                console.log("FINAL AVERAGE 15: " + finalAverage);

                let newAverageTotal = 0;
                let newCounter = 0;

                
                for (let j = 0; j < numArray.length; j++){
                    //console.log("FILLED ARRAY 15: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
                    if (numArray[j] > 0){
                        newAverageTotal += (numArray[j] * (j*10));
                        newCounter += numArray[j];
                    }
                }

                candleAverage15Minutes = newAverageTotal/newCounter;
                console.log("NEW AVERAGE 15: " + newAverageTotal/newCounter);

                let buy10Fifteen: number = open15 - (candleAverage15Minutes-15);
                let sell10Fifteen: number = open15 + (candleAverage15Minutes-15);
                submitTrade('buy', '0.001', buy10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                submitTrade('sell', '0.001', sell10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                buy10Fifteen = open15 - candleAverage15Minutes;
                sell10Fifteen = open15 + candleAverage15Minutes;
                submitTrade('buy', '0.001', buy10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                submitTrade('sell', '0.001', sell10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                buy10Fifteen = open15 - (candleAverage15Minutes+15);
                sell10Fifteen = open15 + (candleAverage15Minutes+15);
                submitTrade('buy', '0.001', buy10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                submitTrade('sell', '0.001', sell10Fifteen.toFixed(2).toString(), '10.0 15 Minutes');
                buy10Fifteen = open15 - (candleAverage15Minutes+30);
                sell10Fifteen = open15 + (candleAverage15Minutes+30);
                submitTrade('buy', '0.001', buy10Fifteen.toFixed(2).toString(), '10.0 15 Minutes Keep');
                submitTrade('sell', '0.001', sell10Fifteen.toFixed(2).toString(), '10.0 15 Minutes Keep');

               
                
            });




            
            
        }




        if (high30 < sellingPrice){   //getting candlestick numbers
            high30 = sellingPrice;     
        }
        if (low30 > sellingPrice){     
            low30 = sellingPrice;
        }
        if (open30Boolean == false){ 
            open30 = sellingPrice;
            open30Boolean = true;
        }
        close30 = sellingPrice;

        if (high1Hour < sellingPrice){   //getting candlestick numbers
            high1Hour = sellingPrice;     
        }
        if (low1Hour > sellingPrice){     
            low1Hour= sellingPrice;
        }
        if (open1HourBoolean == false){ 
            open1Hour = sellingPrice;
            open1HourBoolean = true;
        }
        close1Hour = sellingPrice;



        let ratio = buyingSize/sellingSize; //leaving to avoid typescript errors for now
        
            if (buyingSize > 10000000){    //just for testing so typescript doesnt give errors
                submitTrade('buy', '0.02', '9237', '38.2');
                console.log(printOrderbook(book, 5));
                printOrderbookStats(book);
                orderDone = null;
                if (buyingPrice>1)ratio = ratio+1;{}
                tradeFinalized = null;
                cancelled = true;
                logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);
                checkBook(book);
        
        
            }
         
    }
    else {

        // fiveMinuteTrades(book).then((result: string) => {
        //     console.log("RESULT OF FIVE MIN TRADES: " + result);
        //     if (Date.now() - global15MinuteCounter > 900000){
        //         setTimeout(fifteenMinuteTrades, 2000, book);
        //         //setTimeout(function(){ fifteenMinuteTrades(book) },10000);
        //     }    
        // });

        fiveMinuteTrades(book).then((result: string) => {
            console.log("RESULT OF FIVE MIN TRADES: " + result); 
            
        }).then(function() {
            return promiseTimeout(2000);
        }).then(function() {
            if (Date.now() - global15MinuteCounter > 900000){
                fifteenMinuteTrades(book).then((result: string) => {
                    console.log("RESULT OF FIFTEEN MIN TRADES: " + result);
                      
                });
            } 
            console.log("MADE IT BEFORE 15 WITH NO ERRORS");
        }).then(function() {
            return promiseTimeout(2000);
        }).then(function() {
            console.log("MADE IT AFTER 15 WITH NO ERRORS");
            fiveMinuteInitialTradeCounter = 0;
            fifteenMinuteInitialTradeCounter = 0;  
        });

        
       

    }

    

    


    
    

    
    
    
        

        
        

    
    
    
}

function promiseTimeout(time: number) {
    return new Promise(function(resolve,reject){
        setTimeout(function(){resolve(time);},time);
    });
};


function uptrendCalculator(time: string) {
    
    
    if (time === '5 Minutes'){ 
        difference5Min = close5 - open5;
        ret2FiveMin = close5 - (difference5Min * 0.382); //using this one for down then up
        ret5FiveMin = close5 - (difference5Min * 0.90); //CUSTOM MADE
        ext5FiveMin = close5 + (difference5Min * 1);    //using this for hail mary straight up 
    }
    else if (time === '15 Minutes'){ 
        difference15Min = close15 - open15;
        ret2FifteenMin = close5 - (difference15Min * 0.382); //using this one for down then up
        ret5FifteenMin = close15 - (difference15Min * 0.90); //CUSTOM MADE
        ext5FifteenMin = close15 + (difference15Min * 1);    //using this for hail mary straight up 
    }
    else if (time === '30 Minutes'){ 
        difference30Min = high30 - low30;
        ret2ThirtyMin = high30 - (difference30Min * 0.382); //using this one for down then up
        ret5ThirtyMin = high30 - (difference30Min * 0.90); //CUSTOM MADE
        ext5ThirtyMin = close30 + (difference30Min * 1);    //using this for hail mary straight up 
    }
    else if (time === '1 Hour'){ 
        difference1Hour = high1Hour - low1Hour;
        ret2OneHour = high1Hour - (difference1Hour * 0.382); //using this one for down then up
        ret5OneHour = high1Hour - (difference1Hour * 0.90); //CUSTOM MADE
        ext5OneHour = close1Hour + (difference1Hour * 1);    //using this for hail mary straight up 
    }
            
}

function downtrendCalculator(time: string) {
    
    if (time === '5 Minutes'){       
        difference5Min = open5 - close5;
        ret2FiveMin = close5 + (difference5Min * 0.382);  //using this one for up then down
        ret5FiveMin = close5 + (difference5Min * 0.90); //CUSTOM MADE 
        ext5FiveMin = close5 - (difference5Min * 1);    //using this for hail mary straight down 
    }
    else if (time === '15 Minutes'){        
        difference15Min = open15 - close15;
        ret2FifteenMin = close15 + (difference15Min * 0.382); //using this one for up then down
        ret5FifteenMin = close15 + (difference15Min * 0.90); //CUSTOM MADE 
        ext5FifteenMin = close15 - (difference15Min * 1);    //using this for hail mary straight down 
    }
    else if (time === '30 Minutes'){        
        difference30Min = high30 - low30;
        ret2ThirtyMin = low30 + (difference30Min * 0.382); //using this one for up then down
        ret5ThirtyMin = low30 + (difference30Min * 0.90); //CUSTOM MADE 
        ext5ThirtyMin = close30 - (difference30Min * 1);    //using this for hail mary straight down 
    }
    else if (time === '1 Hour'){        
        difference1Hour = high1Hour - low1Hour;
        ret2OneHour = low1Hour + (difference1Hour * 0.382); //using this one for up then down
        ret5OneHour = low1Hour + (difference1Hour * 0.90); //CUSTOM MADE 
        ext5OneHour = close1Hour - (difference1Hour * 1);    //using this for hail mary straight down 
    }
    
            
}

function pushMessage(title: string, msg: string): void {
    pusher.note(deviceID, title, msg, (err: Error, res: any) => {
        if (err) {
            logger.log('error', 'Push message failed', err);
            return;
        }
        //logger.log('info', 'Push message result', res);
    });
}

function fiveMinuteTrades(book: LiveOrderbook): Promise<string> {
    
    return new Promise(function (resolve, reject){
    
    initial10Close5 = true;
    
    if (fiveMinKeep == true){
        if (Math.abs(close5 - open5) < (candleAverage5Minutes+25)){
            fiveMinKeep = false;
        }
        else{
            cancelMinuteOrders(fiveMinuteOrdersKeep, '5 Minutes Keep');
        }
    }
    
    let fiveMinuteAmountToTrade = .001 * fiveMinuteInitialTradeCounter;
    console.log("THE COUNTER : " + fiveMinuteInitialTradeCounter + "AND AMOUNT: " + fiveMinuteAmountToTrade);
            
    if ((close5 > open5) && ((close5 - open5) > (candleAverage5Minutes-10))){ //green bar, price went up

        bigCandle5 = true;

        uptrendCalculator('5 Minutes');

        cancelMinuteOrders(fiveMinuteOrders, '5 Minutes').then((result: string) => {
        
        console.log("5 MIN CANCEL RESULT: " + result);

        //3 cases, 
        //1. goes down then back up
        //2. goes back down, usually from previous close5 straight down
        //3. only goes up 



        //this is retracement 38.2%
        pushMessage('INITIAL BUY 5 38.2% ORDER', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        pushMessage('FOLLOWING SELL 5 38.2% ORDER', `Going to submit limit sell at $${close5}`); //sell order
        
        submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        
        if (fiveMinKeep == true){
            followingOrder38FiveMinKeep = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: fiveMinuteAmountToTrade.toFixed(3).toString(),
                price: close5.toFixed(2).toString()
            };
        }
        else {
            followingOrder38FiveMin = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: fiveMinuteAmountToTrade.toFixed(3).toString(),
                price: close5.toFixed(2).toString()
            };
        }
        




        
        pushMessage('FOLLOWING BUY 5 10.0% ORDER', `Going to submit limit buy at $${ret5FiveMin}`); //buy

        submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), ret5FiveMin.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');


        //this is extension 100% - incase a big jump
        pushMessage('SELL 5 100% ORDER', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes up only
        
        submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), ext5FiveMin.toFixed(2).toString(), '100 5 Minutes');





        console.log('BUY ORDER INITIAL 5 38.2', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        console.log('SELL ORDER FOLLOWING 5 38.2', `Going to submit limit sell at $${close5}`); //sell order
        console.log('SELL ORDER INITIAL 5 10.0', `Submitted max sell at $${open5+(fiveMinuteInitialTradeCounter == 1 ? (candleAverage5Minutes-10): fiveMinuteInitialTradeCounter == 2 ? candleAverage5Minutes: fiveMinuteInitialTradeCounter == 3 ? (candleAverage5Minutes+10): (candleAverage5Minutes+25))}`); //if it goes up slightly then goes down
        console.log('BUY ORDER FOLLOWING 5 10.0', `Going to submit limit buy at $${ret5FiveMin}`); //buy
        console.log('SELL ORDER 5 100', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes up only

        initial10Triggered5 = false;
        initial10Close5 = false;

    });    
        
    }

    else if ((open5 > close5) && ((open5 - close5) > (candleAverage5Minutes-10))){ //red bar, price went down

        bigCandle5 = true;

        downtrendCalculator('5 Minutes');

        cancelMinuteOrders(fiveMinuteOrders, '5 Minutes').then((result: string) => {

        
        console.log("5 MIN CANCEL RESULT: " + result);
        

        //3 cases, 
        //1. goes up then back down
        //2. goes back up, usually from previous close5 straight up 
        //3. only goes down  



        //this is retracement 38.2%
        pushMessage('INITIAL SELL 5 38.2% ORDER', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        pushMessage('FOLLOWING BUY 5 38.2% ORDER', `Going to submit limit buy at $${close5}`); //buy order

        submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        

        if (fiveMinKeep == true){
            followingOrder38FiveMinKeep = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: fiveMinuteAmountToTrade.toFixed(3).toString(),
                price: close5.toFixed(2).toString()
            };

        }
        else {
            followingOrder38FiveMin = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: fiveMinuteAmountToTrade.toFixed(3).toString(),
                price: close5.toFixed(2).toString()
            };
        }
        

        


       


        pushMessage('FOLLOWING SELL 5 10.0% ORDER', `Going to submit limit sell at $${ret5FiveMin}`); //sell
        
        submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), ret5FiveMin.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');






        //this is extension 100% - incase a big jump
        pushMessage('BUY 100% ORDER', `Going to submit limit buy at $${ext5FiveMin}`); //if it goes down only

        submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), ext5FiveMin.toFixed(2).toString(), '100 5 Minutes');





        //Print Statements 
        console.log('SELL ORDER INITIAL 5 38.2', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        console.log('BUY ORDER FOLLOWING 5 38.2', `Going to submit limit buy at $${close5}`); //buy order
        console.log('BUY ORDER INITIAL 5 10.0', `Submitted max buy at $${open5-(fiveMinuteInitialTradeCounter == 1 ? (candleAverage5Minutes-10): fiveMinuteInitialTradeCounter == 2 ? candleAverage5Minutes: fiveMinuteInitialTradeCounter == 3 ? (candleAverage5Minutes+10): (candleAverage5Minutes+25))}`); //if it goes down slightly then goes up
        console.log('SELL ORDER FOLLOWING 5 10.0', `Going to submit limit buy at $${ret5FiveMin}`); //buy     
        console.log('BUY ORDER 5 100', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes down only


        initial10Triggered5 = false;
        initial10Close5 = false;

    });      
    
    }

    if (bigCandle5 == false && initial10ExecutedBool5 == true){ //When an initial order executes but the candle isn't big. Will attempt one trade
        initial10ExecutedBool5 = false;
        if (initial10TradeSide5 === 'buy'){
            submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), open5.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');
        }
        else if (initial10TradeSide5 === 'sell'){
            submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), open5.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');
        }
    }

    
    
    if (bigCandle5 == false){  //When the candle isn't big. Need to clear out initial orders
        for (let i: number = 0; i < initialOrder10FiveMin.length; i++){
            gdaxAPI.cancelOrder(initialOrder10FiveMin[i]).then((res: string) => {
                if (fiveMinuteOrders.includes(initialOrder10FiveMin[i])){
                    fiveMinuteOrders.splice(fiveMinuteOrders.indexOf(initialOrder10FiveMin[i]), 1);
                }
                if (i == initialOrder10FiveMin.length-1){
                    initial10Triggered5 = false;  //allows initial order to execute
                    initialOrder10FiveMin = [];     //clearing out array just incase
                    initial10ExecutedBool5 = false; //resetting to false just incase
                    initial10Close5 = false;   //can start looking at close value again
                }
               
            });
        }
    }
    else{
        initialOrder10FiveMin = []; //clearing out array just incase
        initial10ExecutedBool5 = false; //resetting to false for next initial orders
    }

    global5MinuteCounter = Date.now(); //resetting timer
    open5Boolean = false;  //allows open of candle to be inputted
    bigCandle5 = false; //setting big candle to false for next set of orders

    pushMessage('Price Trigger', `OPEN 5 MINS: ${open5} \n HIGH 5 MINS: ${high5} \n LOW 5 MINS: ${low5} \n CLOSE 5 MINS: ${close5}`);
    console.log('Price Trigger', `OPEN 5 MINS: ${open5} \n HIGH 5 MINS: ${high5} \n LOW 5 MINS: ${low5} \n CLOSE 5 MINS: ${close5}`);

    high5 = 0; //resetting high for next candle
    low5 = 99999; //resetting low for next candle

    resolve("5 MINUTES GOOD"); //if the action succeeded
    reject("5 MINTUES ERROR"); //if the action did not succeed
    });
            
}

function fifteenMinuteTrades(book: LiveOrderbook): Promise<string> {
    
    return new Promise(function (resolve, reject){
    
    global15MinuteCounter = Date.now(); //resetting timer early cause 15
    
    initial10Close15 = true;
    
    if (fifteenMinKeep == true){
        if (Math.abs(close15 - open15) < (candleAverage15Minutes+30)){
            fifteenMinKeep = false;
        }
        else{
            cancelMinuteOrders(fifteenMinuteOrdersKeep, '15 Minutes Keep');
        }
    }
    
    let fifteenMinuteAmountToTrade = .001 * fifteenMinuteInitialTradeCounter;
    console.log("THE COUNTER : " + fifteenMinuteInitialTradeCounter + "AND AMOUNT: " + fifteenMinuteAmountToTrade);

    if ((close15 > open15) && ((close15 - open15) > (candleAverage15Minutes-15))){ //green bar, price went up

        
        bigCandle15 = true;

        uptrendCalculator('15 Minutes');

        cancelMinuteOrders(fifteenMinuteOrders, '15 Minutes').then((result: string) => {

        console.log("15 MIN CANCEL RESULT: " + result);

        //3 cases, 
        //1. goes down then back up
        //2. goes back down, usually from previous close5 straight down
        //3. only goes up 



        //this is retracement 38.2%
        pushMessage('INITIAL BUY 15 38.2% ORDER', `Going to submit limit buy at $${ret2FifteenMin}`); //buy order need to buy before sell otherwise dont sell
        pushMessage('FOLLOWING SELL 15 38.2% ORDER', `Going to submit limit sell at $${close15}`); //sell order
        
        submitTrade('buy', fifteenMinuteAmountToTrade.toFixed(3).toString(), ret2FifteenMin.toFixed(2).toString(), '38.2 15 Minutes');
        
        
        if (fifteenMinKeep == true){
            followingOrder38FifteenMinKeep = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: fifteenMinuteAmountToTrade.toFixed(3).toString(),
                price: close15.toFixed(2).toString()
            };
        }
        else {
            followingOrder38FifteenMin = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: fifteenMinuteAmountToTrade.toFixed(3).toString(),
                price: close15.toFixed(2).toString()
            };
        }
        




        

        pushMessage('FOLLOWING BUY 15 10.0% ORDER', `Going to submit limit buy at $${ret5FifteenMin}`); //buy
       
        submitTrade('buy', fifteenMinuteAmountToTrade.toFixed(3).toString(), ret5FifteenMin.toFixed(2).toString(), 'Following Order 10.0 15 Minutes');


        //this is extension 100% - incase a big jump
        pushMessage('SELL 15 100% ORDER', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes up only
        
        submitTrade('sell', fifteenMinuteAmountToTrade.toFixed(3).toString(), ext5FifteenMin.toFixed(2).toString(), '100 15 Minutes');





        console.log('BUY ORDER INITIAL 15 38.2', `Going to submit limit buy at $${ret2FifteenMin}`); 
        console.log('SELL ORDER FOLLOWING 15 38.2', `Going to submit limit sell at $${close15}`); 
        console.log('SELL ORDER INITIAL 15 10.0', `Submitted max sell at $${open15+(fifteenMinuteInitialTradeCounter == 1 ? (candleAverage15Minutes-15): fifteenMinuteInitialTradeCounter == 2 ? candleAverage15Minutes: fifteenMinuteInitialTradeCounter == 3 ? (candleAverage15Minutes+15): (candleAverage15Minutes+30))}`); 
        console.log('BUY ORDER FOLLOWING 15 10.0', `Going to submit limit buy at $${ret5FifteenMin}`); //buy
        console.log('SELL ORDER 15 100', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes up only

        initial10Triggered15 = false;
        initial10Close15 = false;

    });  
        
    }

    else if ((open15 > close15) && ((open15 - close15) > (candleAverage15Minutes-15))){ //red bar, price went down


        bigCandle15 = true;

        downtrendCalculator('15 Minutes');

        cancelMinuteOrders(fifteenMinuteOrders, '15 Minutes').then((result: string) => {

        console.log("15 MIN CANCEL RESULT: " + result);
        

        //3 cases, 
        //1. goes up then back down
        //2. goes back up, usually from previous close5 straight up 
        //3. only goes down  



        //this is retracement 38.2%
        pushMessage('INITIAL SELL 15 38.2% ORDER', `Going to submit limit sell at $${ret2FifteenMin}`); //sell order need to sell before buy otherwise dont buy
        pushMessage('FOLLOWING BUY 15 38.2% ORDER', `Going to submit limit buy at $${close15}`); //buy order

        submitTrade('sell', fifteenMinuteAmountToTrade.toFixed(3).toString(), ret2FifteenMin.toFixed(2).toString(), '38.2 15 Minutes');
        
        if (fifteenMinKeep == true){
            followingOrder38FifteenMinKeep = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: fifteenMinuteAmountToTrade.toFixed(3).toString(),
                price: close15.toFixed(2).toString()
            };
        }
        else {
            followingOrder38FifteenMin = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: fifteenMinuteAmountToTrade.toFixed(3).toString(),
                price: close15.toFixed(2).toString()
            };
        }
        




        

        pushMessage('FOLLOWING SELL 15 10.0% ORDER', `Going to submit limit sell at $${ret5FifteenMin}`); //sell
        
        submitTrade('sell', fifteenMinuteAmountToTrade.toFixed(3).toString(), ret5FifteenMin.toFixed(2).toString(), 'Following Order 10.0 15 Minutes');



        //this is extension 100% - incase a big jump
        pushMessage('BUY 15 100% ORDER', `Going to submit limit buy at $${ext5FifteenMin}`); //if it goes down only

        submitTrade('buy', fifteenMinuteAmountToTrade.toFixed(3).toString(), ext5FifteenMin.toFixed(2).toString(), '100 15 Minutes');





        //Print Statements 
        console.log('SELL ORDER INITIAL 15 38.2', `Going to submit limit sell at $${ret2FifteenMin}`); //sell order need to sell before buy otherwise dont buy
        console.log('BUY ORDER FOLLOWING 15 38.2', `Going to submit limit buy at $${close15}`); //buy order
        console.log('BUY ORDER INITIAL 15 10.0', `Submitted max buy at $${open15-(fifteenMinuteInitialTradeCounter == 1 ? (candleAverage15Minutes-15): fifteenMinuteInitialTradeCounter == 2 ? candleAverage15Minutes: fifteenMinuteInitialTradeCounter == 3 ? (candleAverage15Minutes+15): (candleAverage15Minutes+30))}`); //if it goes down slightly then goes up
        console.log('SELL ORDER FOLLOWING 15 10.0', `Going to submit limit buy at $${ret5FifteenMin}`); //buy     
        console.log('BUY ORDER 15 100', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes down only

        initial10Triggered15 = false;
        initial10Close15 = false;

    }); 
        
    
    }

    if (bigCandle15 == false && initial10ExecutedBool15 == true){
        initial10ExecutedBool15 = false;
        if (initial10TradeSide15 === 'buy'){
            submitTrade('sell', fifteenMinuteAmountToTrade.toFixed(3).toString(), open15.toFixed(2).toString(), 'Following Order 10.0 15 Minutes');
        }
        else if (initial10TradeSide15 === 'sell'){
            submitTrade('buy', fifteenMinuteAmountToTrade.toFixed(3).toString(), open15.toFixed(2).toString(), 'Following Order 10.0 15 Minutes');
        }
    }

    
    
    if (bigCandle15 == false){
        for (let i: number = 0; i < initialOrder10FifteenMin.length; i++){
            gdaxAPI.cancelOrder(initialOrder10FifteenMin[i]).then((res: string) => {
                if (fifteenMinuteOrders.includes(initialOrder10FifteenMin[i])){
                    fifteenMinuteOrders.splice(fifteenMinuteOrders.indexOf(initialOrder10FifteenMin[i]), 1);
                }
                if (i == initialOrder10FifteenMin.length-1){
                    initial10Triggered15 = false;
                    initialOrder10FifteenMin = [];
                    initial10ExecutedBool15 = false;
                    initial10Close15 = false;
                }
               
            });
        }
    }
    else{
        initialOrder10FifteenMin = [];
        initial10ExecutedBool15 = false;
    }




    // global15MinuteCounter = Date.now();
    open15Boolean = false;
    bigCandle15 == false;

    pushMessage('Price Trigger', `OPEN 15 MINS: ${open15} \n HIGH 15 MINS: ${high15} \n LOW 15 MINS: ${low15} \n CLOSE 15 MINS: ${close15}`);
    console.log('Price Trigger', `OPEN 15 MINS: ${open15} \n HIGH 15 MINS: ${high15} \n LOW 15 MINS: ${low15} \n CLOSE 15 MINS: ${close15}`);

    high15 = 0;
    low15 = 99999;
    
    resolve("15 MINUTES GOOD"); //if the action succeeded
    reject("15 MINTUES ERROR"); //if the action did not succeed
    });

}



function cancelMinuteOrders(minuteOrders: Array<string>, time: string): Promise<string> {

    return new Promise(function (resolve, reject){

    console.log("MINUTE: " + time + "AND LENGTH: " +  minuteOrders.length);
    for (let l = 0; l < minuteOrders.length; l++){
        gdaxAPI.cancelOrder(minuteOrders[l]).then((res: string) => {
            if (l == minuteOrders.length-1 && time === '5 Minutes'){
                fiveMinuteOrders = [];
            }
            else if (l == minuteOrders.length-1 && time === '15 Minutes'){
                fifteenMinuteOrders = [];
               
            }
            else if (l == minuteOrders.length-1 && time === '5 Minutes Keep'){
                fiveMinuteOrdersKeep = [];
            }
            else if (l == minuteOrders.length-1 && time === '15 Minutes Keep'){
                fifteenMinuteOrdersKeep = [];
            }
        });
    }

    resolve("Resolved minute cancel orders"); //if the action succeeded
    reject("Errored out cancel minute orders"); //if the action did not succeed
    });
}