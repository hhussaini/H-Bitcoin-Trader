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
let followingOrder10FiveMin: PlaceOrderMessage;



let initialOrder38FifteenMin: LiveOrder = null;
let initialOrder10FifteenMin: Array<string> = [];
let initialOrder100FifteenMin: LiveOrder = null;

let followingOrder38FifteenMin: PlaceOrderMessage;
let followingOrder10FifteenMin: PlaceOrderMessage;



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


let stopOrderPrice: number = 0;


let fiveMinuteOrders: Array<string>;
let fifteenMinuteOrders: Array<string>;

// let fiveMinuteOrdersMap: { [key:string]: string; } = {};
// let fifteenMinuteOrdersMap: { [key:string]: string; } = {};

let initial10Triggered5: boolean = false;
let initial10Triggered15: boolean = false;

let bigCandle5: boolean = false;


let initial10TradeSide5: string = "";


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
            console.log(`${tradeExecuted.orderId} order to ${tradeExecuted.side} at ${tradeExecuted.price} leaving ${tradeExecuted.remainingSize} was completed`);

            if (tradeExecuted.orderId == initialOrder38FiveMin.id){
                gdaxAPI.placeOrder(followingOrder38FiveMin).then((result: LiveOrder) => {
                    
                    fiveMinuteOrders.push(result.id);
                    console.log('Order executed', `FOLLOWING Order to ${followingOrder38FiveMin.side} 0.005 at ${followingOrder38FiveMin.price} placed. Result: ${result.status}`);
                    pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder38FiveMin.side} 0.005 at ${followingOrder38FiveMin.price} placed. Result: ${result.status}`);
                });
            }
            else if (initialOrder10FiveMin.includes(tradeExecuted.orderId)){
                initialOrder10FiveMin.splice(initialOrder10FiveMin.indexOf(tradeExecuted.orderId), 1);
                initial10ExecutedBool5 = true;
                initial10TradeSide5 = tradeExecuted.side;
                
            }
            else if (tradeExecuted.orderId == initialOrder38FifteenMin.id){
                gdaxAPI.placeOrder(followingOrder38FifteenMin).then((result: LiveOrder) => {
                    fifteenMinuteOrders.push(result.id);
                    console.log('Order executed', `FOLLOWING Order to ${followingOrder38FifteenMin.side} 0.005 at ${followingOrder38FifteenMin.price} placed. Result: ${result.status}`);
                    pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder38FifteenMin.side} 0.005 at ${followingOrder38FifteenMin.price} placed. Result: ${result.status}`);
                });
            }
            else if (initialOrder10FifteenMin.includes(tradeExecuted.orderId)){
                initial10ExecutedBool15 = true;
                
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
            initialOrder38FiveMin = result;
            fiveMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '100 5 Minutes'){
            initialOrder100FiveMin = result;
            fiveMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '10.0 15 Minutes'){
            initialOrder10FifteenMin.push(result.id);
            fifteenMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '38.2 15 Minutes'){
            initialOrder38FifteenMin = result;
            fifteenMinuteOrders.push(result.id);
        }
        else if (percentAndMin === '100 15 Minutes'){
            initialOrder100FifteenMin = result;
            fifteenMinuteOrders.push(result.id);
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
        close5 = sellingPrice;

        if (initial10Triggered5 == false){
            initial10Triggered5 = true;
            let buy105: number = open5 - 75;
            let sell105: number = open5 + 75;
            submitTrade('buy', '0.005', buy105.toFixed(2).toString(), '10.0');
            submitTrade('sell', '0.005', sell105.toFixed(2).toString(), '10.0');
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
        close15 = sellingPrice;

        if (initial10Triggered15 == false){
            initial10Triggered15 = true;
            let buy1015: number = open15 - 100;
            let sell1015: number = open15 + 100;
            submitTrade('buy', '0.005', buy1015.toFixed(2).toString(), '10.0');
            submitTrade('sell', '0.005', sell1015.toFixed(2).toString(), '10.0');
            let buy10152: number = open15 - 200;
            let sell10152: number = open15 + 200;
            submitTrade('buy', '0.005', buy10152.toFixed(2).toString(), '10.0');
            submitTrade('sell', '0.005', sell10152.toFixed(2).toString(), '10.0');
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

        fiveMinuteTrades(book).then((result: string) => {
            if (Date.now() - global15MinuteCounter > 900000){
                fifteenMinuteTrades(book);
            }    
        });

        
       

    }

    

    


    
    

    
    
    
        

        
        

    
    
    
}



function uptrendCalculator(time: string) {
    
    
    if (time === '5 Minutes'){ 
        difference5Min = high5 - low5;
        ret2FiveMin = high5 - (difference5Min * 0.382); //using this one for down then up
        ret5FiveMin = high5 - (difference5Min * 0.90); //CUSTOM MADE
        ext5FiveMin = close5 + (difference5Min * 1);    //using this for hail mary straight up 
    }
    else if (time === '15 Minutes'){ 
        difference15Min = high15 - low15;
        ret2FifteenMin = high15 - (difference15Min * 0.382); //using this one for down then up
        ret5FifteenMin = high15 - (difference15Min * 0.90); //CUSTOM MADE
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
        difference5Min = high15 - low15;
        ret2FifteenMin = low15 + (difference5Min * 0.382); //using this one for up then down
        ret5FifteenMin = low15 + (difference5Min * 0.90); //CUSTOM MADE 
        ext5FifteenMin = close15 - (difference5Min * 1);    //using this for hail mary straight down 
    }
    else if (time === '15 Minutes'){        
        difference15Min = high5 - low5;
        ret2FiveMin = low5 + (difference15Min * 0.382); //using this one for up then down
        ret5FiveMin = low5 + (difference15Min * 0.90); //CUSTOM MADE 
        ext5FiveMin = close5 - (difference15Min * 1);    //using this for hail mary straight down 
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
        
        
    
            
    if ((close5 > open5) && ((close5 - open5) > 75)){ //green bar, price went up

        bigCandle5 = true;

        uptrendCalculator('5 Minutes');

        cancelMinuteOrders(fiveMinuteOrders).then((result: string) => {
        
        

        //3 cases, 
        //1. goes down then back up
        //2. goes back down, usually from previous close5 straight down
        //3. only goes up 



        //this is retracement 38.2%
        pushMessage('INITIAL BUY 38.2% ORDER', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        pushMessage('FOLLOWING SELL 38.2% ORDER', `Going to submit limit sell at $${close5}`); //sell order
        
        submitTrade('buy', '0.005', ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        
        followingOrder38FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'sell',
            size: '0.005',
            price: close5.toFixed(2).toString()
        };




        
        pushMessage('FOLLOWING BUY 10.0% ORDER', `Going to submit limit buy at $${ret5FiveMin}`); //buy

        
        followingOrder10FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'buy',
            size: '0.005',
            price: ret5FiveMin.toFixed(2).toString()
        };



        //this is extension 100% - incase a big jump
        pushMessage('SELL 100% ORDER', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes up only
        
        submitTrade('sell', '0.005', ext5FiveMin.toFixed(2).toString(), '100 5 Minutes');





        console.log('BUY ORDER 38.2', `Going to submit limit buy at $${ret2FiveMin}`); //buy order need to buy before sell otherwise dont sell
        console.log('SELL ORDER 38.2', `Going to submit limit sell at $${close5}`); //sell order
        console.log('SELL ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes up slightly then goes down
        console.log('BUY ORDER 10.0', `Going to submit limit buy at $${ret5FiveMin}`); //buy
        console.log('SELL ORDER 100', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes up only

    });    
        
    }

    else if ((open5 > close5) && ((open5 - close5) > 75)){ //red bar, price went down

        bigCandle5 = true;

        downtrendCalculator('5 Minutes');

        cancelMinuteOrders(fiveMinuteOrders).then((result: string) => {

        

        

        //3 cases, 
        //1. goes up then back down
        //2. goes back up, usually from previous close5 straight up 
        //3. only goes down  



        //this is retracement 38.2%
        pushMessage('INITIAL SELL 38.2% ORDER', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        pushMessage('FOLLOWING BUY 38.2% ORDER', `Going to submit limit buy at $${close5}`); //buy order

        submitTrade('sell', '0.005', ret2FiveMin.toFixed(2).toString(), '38.2 5 Minutes');
        
        followingOrder38FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'buy',
            size: '0.005',
            price: close5.toFixed(2).toString()
        };




       
        pushMessage('FOLLOWING SELL 10.0% ORDER', `Going to submit limit sell at $${ret5FiveMin}`); //sell
        
        followingOrder10FiveMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'sell',
            size: '0.005',
            price: ret5FiveMin.toFixed(2).toString()
        };




        //this is extension 100% - incase a big jump
        pushMessage('BUY 100% ORDER', `Going to submit limit buy at $${ext5FiveMin}`); //if it goes down only

        submitTrade('buy', '0.005', ext5FiveMin.toFixed(2).toString(), '100 5 Minutes');





        //Print Statements 
        console.log('SELL ORDER 38.2', `Going to submit limit sell at $${ret2FiveMin}`); //sell order need to sell before buy otherwise dont buy
        console.log('BUY ORDER 38.2', `Going to submit limit buy at $${close5}`); //buy order
        console.log('BUY ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes down slightly then goes up
        console.log('SELL ORDER 10.0', `Going to submit limit buy at $${ret5FiveMin}`); //buy     
        console.log('BUY ORDER 100', `Going to submit limit sell at $${ext5FiveMin}`); //if it goes down only


    });      
    
    }

    if (bigCandle5 == false && initial10ExecutedBool5 == true){
        initial10ExecutedBool5 = false;
        if (initial10TradeSide5 === 'buy'){
            submitTrade('sell', '0.005', open5.toFixed(2).toString(), 'following 10 not big candle');
        }
        else if (initial10TradeSide5 === 'sell'){
            submitTrade('buy', '0.005', open5.toFixed(2).toString(), 'following 10 not big candle');
        }
    }

    
    
    if (bigCandle5 == false){
        for (let i: number = 0; i < initialOrder10FiveMin.length; i++){
            gdaxAPI.cancelOrder(initialOrder10FiveMin[i]).then((res: string) => {
                if (i == initialOrder10FiveMin.length-1){
                    initial10Triggered5 = false;
                    initialOrder10FiveMin = [];
                    initial10ExecutedBool5 = false;
                }
               
            });
        }
    }
    else{
        initialOrder10FiveMin = [];
        initial10ExecutedBool5 = false;
    }

    global5MinuteCounter = Date.now();
    open5Boolean = false;
    bigCandle5 = false;

    pushMessage('Price Trigger', `OPEN 5 MINS: ${open5} \n HIGH 5 MINS: ${high5} \n LOW 5 MINS: ${low5} \n CLOSE 5 MINS: ${close5}`);
    console.log('Price Trigger', `OPEN 5 MINS: ${open5} \n HIGH 5 MINS: ${high5} \n LOW 5 MINS: ${low5} \n CLOSE 5 MINS: ${close5}`);

    high5 = 0;
    low5 = 99999;

    resolve(); //if the action succeeded
    reject(); //if the action did not succeed
    });
            
}

function fifteenMinuteTrades(book: LiveOrderbook) {
    
            
    if ((close15 > open15) && ((close15 - open15) > 75)){ //green bar, price went up

        //gdaxAPI.cancelAllOrders(product); // cancelling orders when another large graph is seen
        
        for (let l = 0; l < fifteenMinuteOrders.length; l++){
            gdaxAPI.cancelOrder(fifteenMinuteOrders[l]);
        }

        uptrendCalculator('15 Minutes');

        //3 cases, 
        //1. goes down then back up
        //2. goes back down, usually from previous close5 straight down
        //3. only goes up 



        //this is retracement 38.2%
        pushMessage('INITIAL BUY 38.2% ORDER', `Going to submit limit buy at $${ret2FifteenMin}`); //buy order need to buy before sell otherwise dont sell
        pushMessage('FOLLOWING SELL 38.2% ORDER', `Going to submit limit sell at $${close15}`); //sell order
        
        submitTrade('buy', '0.005', ret2FifteenMin.toFixed(2).toString(), '38.2 15 Minutes');
        
        followingOrder38FifteenMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'sell',
            size: '0.005',
            price: close15.toFixed(2).toString()
        };




        

        pushMessage('INITIAL SELL 10.0% ORDER', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes down straight
        pushMessage('FOLLOWING BUY 10.0% ORDER', `Going to submit limit buy at $${ret5FifteenMin}`); //buy

        
        followingOrder10FifteenMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'buy',
            size: '0.005',
            price: ret5FifteenMin.toFixed(2).toString()
        };



        //this is extension 100% - incase a big jump
        pushMessage('SELL 100% ORDER', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes up only
        
        submitTrade('sell', '0.005', ext5FifteenMin.toFixed(2).toString(), '100 15 Minutes');





        console.log('BUY ORDER 38.2', `Going to submit limit buy at $${ret2FifteenMin}`); //buy order need to buy before sell otherwise dont sell
        console.log('SELL ORDER 38.2', `Going to submit limit sell at $${close15}`); //sell order
        console.log('SELL ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes up slightly then goes down
        console.log('BUY ORDER 10.0', `Going to submit limit buy at $${ret5FifteenMin}`); //buy
        console.log('SELL ORDER 100', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes up only

        
        
    }

    else if ((open15 > close15) && ((open15 - close15) > 75)){ //red bar, price went down

        //gdaxAPI.cancelAllOrders(product); // cancelling orders when another large graph is seen

        for (let l = 0; l < fifteenMinuteOrders.length; l++){
            gdaxAPI.cancelOrder(fifteenMinuteOrders[l]);
        }


        downtrendCalculator('15 Minutes');

        //3 cases, 
        //1. goes up then back down
        //2. goes back up, usually from previous close5 straight up 
        //3. only goes down  



        //this is retracement 38.2%
        pushMessage('INITIAL SELL 38.2% ORDER', `Going to submit limit sell at $${ret2FifteenMin}`); //sell order need to sell before buy otherwise dont buy
        pushMessage('FOLLOWING BUY 38.2% ORDER', `Going to submit limit buy at $${close15}`); //buy order

        submitTrade('sell', '0.005', ret2FifteenMin.toFixed(2).toString(), '38.2 15 Minutes');
        
        followingOrder38FifteenMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'buy',
            size: '0.005',
            price: close15.toFixed(2).toString()
        };




        

        pushMessage('INITIAL BUY 10.0% ORDER', `Going to submit limit buy at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes up straight
        pushMessage('FOLLOWING SELL 10.0% ORDER', `Going to submit limit sell at $${ret5FifteenMin}`); //sell
        
        followingOrder10FifteenMin = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: 'sell',
            size: '0.005',
            price: ret5FifteenMin.toFixed(2).toString()
        };




        //this is extension 100% - incase a big jump
        pushMessage('BUY 100% ORDER', `Going to submit limit buy at $${ext5FifteenMin}`); //if it goes down only

        submitTrade('buy', '0.005', ext5FifteenMin.toFixed(2).toString(), '100 15 Minutes');





        //Print Statements 
        console.log('SELL ORDER 38.2', `Going to submit limit sell at $${ret2FifteenMin}`); //sell order need to sell before buy otherwise dont buy
        console.log('BUY ORDER 38.2', `Going to submit limit buy at $${close15}`); //buy order
        console.log('BUY ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes down slightly then goes up
        console.log('SELL ORDER 10.0', `Going to submit limit buy at $${ret5FifteenMin}`); //buy     
        console.log('BUY ORDER 100', `Going to submit limit sell at $${ext5FifteenMin}`); //if it goes down only


        
    
    }

    global15MinuteCounter = Date.now();
    open15Boolean = false;
    

    pushMessage('Price Trigger', `OPEN 15 MINS: ${open15} \n HIGH 15 MINS: ${high15} \n LOW 15 MINS: ${low15} \n CLOSE 15 MINS: ${close15}`);
    console.log('Price Trigger', `OPEN 15 MINS: ${open15} \n HIGH 15 MINS: ${high15} \n LOW 15 MINS: ${low15} \n CLOSE 15 MINS: ${close15}`);

    high15 = 0;
    low15 = 99999;
    
    

}



function cancelMinuteOrders(minuteOrders: Array<string>): Promise<string> {

    return new Promise(function (resolve, reject){

    for (let l = 0; l < minuteOrders.length; l++){
        gdaxAPI.cancelOrder(minuteOrders[l]);
    }

    resolve("Resolved cancel minute orders"); //if the action succeeded
    reject("Errored out cancel minute orders"); //if the action did not succeed
    });
}