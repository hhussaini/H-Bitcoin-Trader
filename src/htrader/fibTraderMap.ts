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

//ONLY 5 TOTALLY NEW MAP IDEA

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
// let difference15Min: number = 0;


let ret2FiveMin: number;
let ret5FiveMin: number;
// let ext5FiveMin: number;

// let ret2FifteenMin: number;
// let ret5FifteenMin: number;
// let ext5FifteenMin: number;


let high5: number = 0; //important stuff
let low5: number = 99999;
let open5: number = 0;
let open5Boolean: boolean = false;
let close5: number = 0;
let global5MinuteCounter: number = Date.now();


// let high15: number = 0; //important stuff
// let low15: number = 99999;
// let open15: number = 0;
// let open15Boolean: boolean = false;
// let close15: number = 0;
// let global15MinuteCounter: number = Date.now();



//VERY IMPORTANT LiveOrders are the INITIAL order of each set
//PlaceOrderMessages are the FOLLOWING in the set that will only occur when the initial liveOrder is done 
let initialOrder38FiveMin: LiveOrder = null;
let initialOrder10FiveMin: Array<string> = [];
// let initialOrder100FiveMin: LiveOrder = null;

let followingOrder38FiveMin: PlaceOrderMessage;
let followingOrder10FiveMin: LiveOrder;



// let initialOrder38FifteenMin: LiveOrder = null;
// let initialOrder10FifteenMin: Array<string> = [];
// let initialOrder100FifteenMin: LiveOrder = null;

// let followingOrder38FifteenMin: PlaceOrderMessage;
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
// let initial10ExecutedBool15: boolean = false;
let cancelled: boolean = false;



// let fiveMinuteOrders: Array<string> = [];
// let fifteenMinuteOrders: Array<string> = [];

// let fiveMinuteOrdersMap: { [key:string]: string; } = {};
// let fifteenMinuteOrdersMap: { [key:string]: string; } = {};

let initial10Triggered5: boolean = false;
// let initial10Triggered15: boolean = false;

let initial10Close5: boolean = false;
// let initial10Close15: boolean = false;

let bigCandle5: boolean = false;
// let bigCandle15: boolean = false;

let initial10TradeSide5: string = "";
// let initial10TradeSide15: string = "";


let fiveMinuteInitialTradeCounter: number = 0;
// let fifteenMinuteInitialTradeCounter: number = 0;

//let fiveMinuteAmountToTrade: number = 0;
//let fifteenMinuteAmountToTrade: number = 0;

let candleAverage5Minutes: number = 0;
// let candleAverage15Minutes: number = 0;

let netAmountBtcTraded5Minutes: number = 0; //VERY IMPORTANT, POSITIVE IS BUYING, NEGATIVE IS SELLING
// let netAmountBtcTraded15Minutes: number = 0; //VERY IMPORTANT, POSITIVE IS BUYING, NEGATIVE IS SELLING


//Each key returns this object containing 4 items
type KeyOrders = {followingOrder10 : string, initialOrder38 : LiveOrder, followingOrder38Order : PlaceOrderMessage, followingOrder38Id: string};
let keyOrders: KeyOrders = {
    followingOrder10: "",  //the following Order10. If this is hit BEFORE followingOrder38Id, cancel followingOrder38Id
    initialOrder38: null, //initial Order 38 which will control following Order38
    followingOrder38Order: null, //following Order 38 PlaceOrderMessage, after the order is placed we get the ID
    followingOrder38Id: "" //ID after placng order, incase we want to cancel later
};

//VERY IMPORTANT, MAP OF ALL ORDERS, Key is the ID of the latest initial10Order
let ordersMap: Map<string, KeyOrders> = new Map<string, KeyOrders>();

let finalInitialOrder10: string = ""; //Key which is used for ordersMap

const io = require('socket.io-client');
const socket = io.connect('https://powerful-dawn-77023.herokuapp.com/');

socket.on('Stop Program', function (data: any) {
    console.log(data);
    process.exit();
});


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

            console.log("TRADE EXECUTED MESSAGE RECEIVED TO " + tradeExecuted.side + " AMOUNT " + tradeExecuted.tradeSize + " AT PRICE " + tradeExecuted.price);

            

            
                
                if (tradeExecuted.side == "buy"){
                    netAmountBtcTraded5Minutes += parseFloat(tradeExecuted.tradeSize);
                }
                else if (tradeExecuted.side == "sell"){
                    netAmountBtcTraded5Minutes -= parseFloat(tradeExecuted.tradeSize);
                }
                console.log("NET AMOUNT TRADED FOR 5 MINUTE CHART: " + netAmountBtcTraded5Minutes);
            

            if (initialOrder10FiveMin.includes(tradeExecuted.orderId)){
                console.log(`Initial Order 10 5 Minutes to ${tradeExecuted.side} was completed`);
                initialOrder10FiveMin.splice(initialOrder10FiveMin.indexOf(tradeExecuted.orderId), 1);
                initial10ExecutedBool5 = true;
                initial10TradeSide5 = tradeExecuted.side;
                fiveMinuteInitialTradeCounter++;
                console.log("COUNTER 5:" + fiveMinuteInitialTradeCounter);
                finalInitialOrder10 = tradeExecuted.orderId;
            }

            for (let [key, value] of ordersMap) {
                if (tradeExecuted.orderId == value.followingOrder10){
                    if (value.followingOrder38Id.length > 0){
                        gdaxAPI.cancelOrder(value.followingOrder38Id).then((res: string) => {
                           ordersMap.delete(key);
                        });
                    }
                }
                else if (value.initialOrder38 != null){
                    if (tradeExecuted.orderId == value.initialOrder38.id){
                        gdaxAPI.placeOrder(value.followingOrder38Order).then((result: LiveOrder) => {
                            console.log("KEY VAL BEFORE: " + key, value);
                            value.followingOrder38Id = result.id;
                            ordersMap.set(key, value);
                            console.log("KEY VAL AFTER: " + key, value);
                        });
                    }
                }
                else if (tradeExecuted.orderId == value.followingOrder38Id){
                    console.log("NEXT TRADE 38 FINISHED");
                }
                console.log(key, value);
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
        }
        else if (percentAndMin === '38.2 5 Minutes'){
          
            initialOrder38FiveMin = result;
            keyOrders.initialOrder38 = result;
            
        }
      
        else if (percentAndMin === 'Following Order 10.0 5 Minutes'){
            followingOrder10FiveMin = result;
            keyOrders.followingOrder10 = result.id;
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
                let numArray = new Array(20).fill(0);
                let average = 0;
                let averageCounter = 0;
                for (let i = 0; i < 121; i++){ //hardcoded for 10 hours. (120*5)/60  
                    let open = Number(res[i][3]);
                    let close = Number(res[i][4]);
                    //console.log("VAL: " + Math.abs(open - close));
                    if (Math.abs(open - close) > 10){    //everything above 10 because 5 minute candles arent so big
                        average += Math.abs(open - close);
                        averageCounter++;
                        //console.log("AVG: " + average);
                        if (Math.abs(open - close) < 100){
                            let tens = Math.floor((Math.abs(open - close)/10) % 10);
                            numArray[tens]++;
                        }
                        else if (Math.abs(open - close) >= 100 && Math.abs(open - close) < 200){
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
                    console.log("FILLED ARRAY: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
                    //send("FILLED ARRAY: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
                    if (numArray[j] > 0){
                        newAverageTotal += (numArray[j] * (j*10));
                        newCounter += numArray[j];
                    }
                }

                candleAverage5Minutes = newAverageTotal/newCounter;
                console.log("NEW AVERAGE: " + newAverageTotal/newCounter);
                
                
                
                let buy10Five: number = open5 - (candleAverage5Minutes-5);
                submitTrade('buy', '0.002', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - (candleAverage5Minutes);
                submitTrade('buy', '0.002', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - (candleAverage5Minutes+5);
                submitTrade('buy', '0.002', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
                buy10Five = open5 - (candleAverage5Minutes+10);
                submitTrade('buy', '0.002', buy10Five.toFixed(2).toString(), '10.0 5 Minutes');
            
            

            
                let sell10Five: number = open5 + (candleAverage5Minutes-5);
                submitTrade('sell', '0.002', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');              
                sell10Five = open5 + (candleAverage5Minutes);
                submitTrade('sell', '0.002', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                sell10Five = open5 + (candleAverage5Minutes+5);
                submitTrade('sell', '0.002', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                sell10Five = open5 + (candleAverage5Minutes+10);
                submitTrade('sell', '0.002', sell10Five.toFixed(2).toString(), '10.0 5 Minutes');
                
                
            });


            
        }




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
            if (finalInitialOrder10.length > 0){
                console.log("KEY ORDERS: " + keyOrders);
                ordersMap.set(finalInitialOrder10, keyOrders);
                for (let [key, value] of ordersMap) {
                    console.log("MAP VALS: " + key, value);
                }
            }
        }).then(function() {
            return promiseTimeout(2000);
        }).then(function() {
            return promiseTimeout(2000);
        }).then(function() {
            console.log("MADE IT AFTER 5 WITH NO ERRORS");
            fiveMinuteInitialTradeCounter = 0;
            finalInitialOrder10 = ""; 
            keyOrders.followingOrder10 = "";
            keyOrders.initialOrder38 = null;
            keyOrders.followingOrder38Order = null;
            keyOrders.followingOrder38Id = "";
            for (let [key, value] of ordersMap) {
                console.log("MAP VALS: " + key, value);
            }
              
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
   
    }
    
            
}

function downtrendCalculator(time: string) {
    
    if (time === '5 Minutes'){       
        difference5Min = open5 - close5;
        ret2FiveMin = close5 + (difference5Min * 0.382);  //using this one for up then down
        ret5FiveMin = close5 + (difference5Min * 0.90); //CUSTOM MADE 
     
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
    
    
    
    let fiveMinuteAmountToTrade = (.002 * fiveMinuteInitialTradeCounter)/2;
    console.log("THE COUNTER : " + fiveMinuteInitialTradeCounter + "AND AMOUNT: " + fiveMinuteAmountToTrade);
            
    if ((close5 > open5) && ((close5 - open5) > (candleAverage5Minutes-5))){ //green bar, price went up

        bigCandle5 = true;

        uptrendCalculator('5 Minutes');

 
        //2 cases, 
        //1. goes down then back up
        //2. goes back down, usually from previous close5 straight down
 



        //this is retracement 38.2%
        pushMessage('INITIAL BUY 5 38.2% ORDER', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        pushMessage('FOLLOWING SELL 5 38.2% ORDER', `Going to submit limit sell at $${close5}`); //sell order
        
        submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        
        
        followingOrder38FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'sell',
            size: fiveMinuteAmountToTrade.toFixed(3).toString(),
            price: close5.toFixed(2).toString()
        };
        
        
        keyOrders.followingOrder38Order = followingOrder38FiveMin;



        
        pushMessage('FOLLOWING BUY 5 10.0% ORDER', `Going to submit limit buy at $${ret5FiveMin}`); //buy

        submitTrade('buy', fiveMinuteAmountToTrade.toFixed(3).toString(), ret5FiveMin.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');


    





        console.log('BUY ORDER INITIAL 5 38.2', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        console.log('SELL ORDER FOLLOWING 5 38.2', `Going to submit limit sell at $${close5}`); //sell order
        console.log('SELL ORDER INITIAL 5 10.0', `Submitted max sell at $${open5+(fiveMinuteInitialTradeCounter == 1 ? (candleAverage5Minutes-10): fiveMinuteInitialTradeCounter == 2 ? candleAverage5Minutes: fiveMinuteInitialTradeCounter == 3 ? (candleAverage5Minutes+10): (candleAverage5Minutes+25))}`); //if it goes up slightly then goes down
        console.log('BUY ORDER FOLLOWING 5 10.0', `Going to submit limit buy at $${ret5FiveMin}`); //buy

        initial10Close5 = false;


        
    }

    else if ((open5 > close5) && ((open5 - close5) > (candleAverage5Minutes-5))){ //red bar, price went down

        bigCandle5 = true;

        downtrendCalculator('5 Minutes');

    


        //2 cases, 
        //1. goes up then back down
        //2. goes back up, usually from previous close5 straight up 
   



        //this is retracement 38.2%
        pushMessage('INITIAL SELL 5 38.2% ORDER', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        pushMessage('FOLLOWING BUY 5 38.2% ORDER', `Going to submit limit buy at $${close5}`); //buy order

        submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        

       
       
        followingOrder38FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'buy',
            size: fiveMinuteAmountToTrade.toFixed(3).toString(),
            price: close5.toFixed(2).toString()
        };
    
    
        keyOrders.followingOrder38Order = followingOrder38FiveMin;
        


       


        pushMessage('FOLLOWING SELL 5 10.0% ORDER', `Going to submit limit sell at $${ret5FiveMin}`); //sell
        
        submitTrade('sell', fiveMinuteAmountToTrade.toFixed(3).toString(), ret5FiveMin.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');








        //Print Statements 
        console.log('SELL ORDER INITIAL 5 38.2', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        console.log('BUY ORDER FOLLOWING 5 38.2', `Going to submit limit buy at $${close5}`); //buy order
        console.log('BUY ORDER INITIAL 5 10.0', `Submitted max buy at $${open5-(fiveMinuteInitialTradeCounter == 1 ? (candleAverage5Minutes-10): fiveMinuteInitialTradeCounter == 2 ? candleAverage5Minutes: fiveMinuteInitialTradeCounter == 3 ? (candleAverage5Minutes+10): (candleAverage5Minutes+25))}`); //if it goes down slightly then goes up
        console.log('SELL ORDER FOLLOWING 5 10.0', `Going to submit limit sell at $${ret5FiveMin}`); //buy     


        initial10Close5 = false;

  
    
    }

    if (bigCandle5 == false && initial10ExecutedBool5 == true){ //When an initial order executes but the candle isn't big. Will attempt one trade
        initial10ExecutedBool5 = false;
        let smallCandleAmountToTrade5: number = fiveMinuteAmountToTrade*2;
        if (initial10TradeSide5 === 'buy'){
            let sellValue5: number = close5 + 1;
            console.log("sellValue5 on small candle: " + sellValue5 + " and amount to trade: " + smallCandleAmountToTrade5);
            submitTrade('sell', smallCandleAmountToTrade5.toFixed(3).toString(), sellValue5.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');
            
        }
        else if (initial10TradeSide5 === 'sell'){
            let buyValue5: number = close5 - 1;
            console.log("buyValue5 on small candle: " + buyValue5 + " and amount to trade: " + smallCandleAmountToTrade5);
            submitTrade('buy', smallCandleAmountToTrade5.toFixed(3).toString(), buyValue5.toFixed(2).toString(), 'Following Order 10.0 5 Minutes');
           
        }
    }

    
    
    
        console.log("MINUTE 5: AND INITIAL ORDER LENGTH: " +  initialOrder10FiveMin.length);
        console.log("MINUTE 5: AND INITIAL ORDER 0: " +  initialOrder10FiveMin[0]);
        console.log("MINUTE 5: AND INITIAL ORDER 1: " +  initialOrder10FiveMin[1]);
        console.log("MINUTE 5: AND INITIAL ORDER 2: " +  initialOrder10FiveMin[2]);
        console.log("MINUTE 5: AND INITIAL ORDER 3: " +  initialOrder10FiveMin[3]);
        console.log("MINUTE 5: AND INITIAL ORDER 4: " +  initialOrder10FiveMin[4]);
        for (let i: number = 0; i < initialOrder10FiveMin.length; i++){
            gdaxAPI.cancelOrder(initialOrder10FiveMin[i]).then((res: string) => {
                if (i == initialOrder10FiveMin.length-1){
                    initial10Triggered5 = false;  //allows initial order to execute
                    initialOrder10FiveMin = [];     //clearing out array just incase
                    initial10ExecutedBool5 = false; //resetting to false just incase
                    initial10Close5 = false;   //can start looking at close value again
                }
               
            });
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





// function cancelMinuteOrders(minuteOrders: Array<string>, time: string): Promise<string> {

//     return new Promise(function (resolve, reject){

//     console.log("MINUTE: " + time + "AND LENGTH: " +  minuteOrders.length);
//     for (let l = 0; l < minuteOrders.length; l++){
//         gdaxAPI.cancelOrder(minuteOrders[l]).then((res: string) => {
//             if (l == minuteOrders.length-1 && time === '5 Minutes'){
//                 fiveMinuteOrders = [];
//             }
            
           
//         });
//     }

//     resolve("Resolved minute cancel orders"); //if the action succeeded
//     reject("Errored out cancel minute orders"); //if the action did not succeed
//     });
// }