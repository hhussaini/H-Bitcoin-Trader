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

let ret1: number; //fibonacci retracements
let ret2: number;
let ret3: number;
let ret4: number;
let ret5: number;
let ret6: number;
let ret7: number;

let ext1: number; //fibonacci extensions
let ext2: number;
let ext3: number;
let ext4: number;
let ext5: number;
let ext6: number;
let ext7: number;
let ext8: number;
let ext9: number;



let high: number = 0; //important stuff
let low: number = 99999;
let open: number = 0;
let openBoolean: boolean = false;
let close: number = 0;
let global5MinuteCounter: number = Date.now();


//VERY IMPORTANT LiveOrders are the INITIAL order of each set
//PlaceOrderMessages are the FOLLOWING in the set that will only occur when the initial liveOrder is done 
let initialOrder38: LiveOrder = null;
let initialOrder10: LiveOrder = null;
let initialOrder100: LiveOrder = null;

let followingOrder38: PlaceOrderMessage;
let followingOrder10: PlaceOrderMessage;

let tradeFinalized: TradeFinalizedMessage;
let tradeExecuted: TradeExecutedMessage;
let orderDone: OrderDoneMessage;



let initial10ExecutedBool: boolean = false;
let cancelled: boolean = false;

let maxVolume: number = 0;
let stackMaxPos: Array<number>;
let stopOrderPrice: number = 0;
let posToChoose: number = 0;

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

            if (tradeExecuted.orderId == initialOrder38.id){
                gdaxAPI.placeOrder(followingOrder38).then((result: LiveOrder) => {
                    console.log('Order executed', `FOLLOWING Order to ${followingOrder38.side} 0.005 at ${followingOrder38.price} placed. Result: ${result.status}`);
                    pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder38.side} 0.005 at ${followingOrder38.price} placed. Result: ${result.status}`);
                });
            }
            else if (tradeExecuted.orderId == initialOrder10.id){
                initial10ExecutedBool = true;
                gdaxAPI.placeOrder(followingOrder10).then((result: LiveOrder) => {
                    console.log('Order executed', `FOLLOWING Order to ${followingOrder10.side} 0.005 at ${followingOrder10.price} placed. Result: ${result.status}`);
                    pushMessage('Price Trigger', `FOLLOWING Order to ${followingOrder10.side} 0.005 at ${followingOrder10.price} placed. Result: ${result.status}`);
                });
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







function submitTrade(side: string, amount: string, price: string, percent: string) {

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

        if (percent === '38.2'){
            initialOrder38 = result;
        }
        else if (percent === '100'){
            initialOrder100 = result;
        }
        console.log('Order executed', `INITIAL Order to ${order.side} 0.005 placed. Result: ID OF ${percent} is ${result.id} ${result.status}`);
        pushMessage('Price Trigger', `INITIAL Order to ${order.side} 0.005 placed. Result: ID OF ${percent} is ${result.id} ${result.status}`);
    });

    
}


function submitStopTrade(side: string, amount: string, price: string, percent: string, stopPrice: string, stop: string) {
    
        let order: PlaceOrderMessage = {
            type: 'placeOrder',
            time: new Date(),
            productId: product,
            orderType: 'limit',
            side: side,
            size: amount,
            price: price,
            stop: stop,
            stop_price: stopPrice
        };
    
       
    
        gdaxAPI.placeOrder(order).then((result: LiveOrder) => {

            initialOrder10 = result;
            
            console.log(' \n Order executed', `INITIAL STOP Order to ${order.side} 0.005 placed. Result: ID OF ${percent} is ${result.id} ${result.status} AND ${result.extra} AND ${result.price}`);
            pushMessage('Price Trigger', `INITIAL STOP Order to ${order.side} 0.005 placed. Result: ID OF ${percent} is ${result.id} ${result.status}`);
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
        
        if (high < sellingPrice){   //getting candlestick numbers
            high = sellingPrice;     
        }
        if (low > sellingPrice){     
            low = sellingPrice;
        }
        if (openBoolean == false){ 
            open = sellingPrice;
            openBoolean = true;
        }
        close = sellingPrice;

        

    
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

        //console.log(`THIS IS SELLING:  ${sellingSize} AT ${sellingPrice} EACH \n THIS IS BUYING ${buyingSize} AT ${buyingPrice} EACH \n THIS IS RATIO ${ratio}`);
        }

    else{
       
      


        if ((close > open) && ((close - open) > 75)){ //green bar, price went up

            gdaxAPI.cancelAllOrders(product).then((result: string[]) => {
                
                console.log("CANCELLED");
                           
            }); // cancelling orders when another large graph is seen
            
            uptrendCalculator(high, low, close);

            //3 cases, 
            //1. goes down then back up
            //2. goes back down, usually from previous close straight down
            //3. only goes up 



            //this is retracement 38.2%
            pushMessage('INITIAL BUY 38.2% ORDER', `Going to submit limit buy at $${ret2}`); //buy order need to buy before sell otherwise dont sell
            pushMessage('FOLLOWING SELL 38.2% ORDER', `Going to submit limit sell at $${close}`); //sell order
            
            submitTrade('buy', '0.005', ret2.toFixed(2).toString(), '38.2');
            
            followingOrder38 = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: '0.005',
                price: close.toFixed(2).toString()
            };




            //this is special stop order needed to get rightvalue at first
            stackMaxPos = [];
            maxVolume = 0;
            for (let i = 1; i < 25; i++){
                if (book.state().bids[i].totalSize.toNumber() > maxVolume){
                    maxVolume = book.state().bids[i].totalSize.toNumber();
                    stackMaxPos.push(i);
                }
            }
            console.log("\n Number right above: " + book.state().bids[stackMaxPos[stackMaxPos.length - 1] - 1].price.toNumber());
            console.log("\n LOOKING AT: " + book.state().bids[stackMaxPos[stackMaxPos.length - 1]].price.toNumber());

            console.log("LENGTH OF STACKMAXPOS: " + stackMaxPos.length);
            for (let j = 0; j < stackMaxPos.length; j++){
                posToChoose = stackMaxPos.pop();
                if (book.state().bids[posToChoose - 1].price.sub(book.state().bids[posToChoose].price).toNumber() > .01){
                    console.log("\n Number right above: " + book.state().bids[posToChoose - 1].price.toNumber());
                    console.log("\n CHOOSING THIS + 0.01: " + book.state().bids[posToChoose].price.toNumber());
                    stopOrderPrice = book.state().bids[posToChoose].price.toNumber() + 0.01;
                    submitStopTrade('sell', '0.005', stopOrderPrice.toFixed(2).toString(), '10.0', stopOrderPrice.toFixed(2).toString(), 'loss');
                    break;
                }
            
                
            }

            console.log("LENGTH OF STACKMAXPOS AFTER POP: " + stackMaxPos.length);
            
            pushMessage('INITIAL SELL 10.0% ORDER', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes down straight
            pushMessage('FOLLOWING BUY 10.0% ORDER', `Going to submit limit buy at $${ret5}`); //buy

            
            followingOrder10 = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: '0.005',
                price: ret5.toFixed(2).toString()
            };



            //this is extension 100% - incase a big jump
            pushMessage('SELL 100% ORDER', `Going to submit limit sell at $${ext5}`); //if it goes up only
            
            submitTrade('sell', '0.005', ext5.toFixed(2).toString(), '100');





            console.log('BUY ORDER 38.2', `Going to submit limit buy at $${ret2}`); //buy order need to buy before sell otherwise dont sell
            console.log('SELL ORDER 38.2', `Going to submit limit sell at $${close}`); //sell order
            console.log('SELL ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes up slightly then goes down
            console.log('BUY ORDER 10.0', `Going to submit limit buy at $${ret5}`); //buy
            console.log('SELL ORDER 100', `Going to submit limit sell at $${ext5}`); //if it goes up only

            
         
        }

        else if ((open > close) && ((open - close) > 75)){ //red bar, price went down

            gdaxAPI.cancelAllOrders(product).then((result: string[]) => {
                
                console.log("CANCELLED");
                           
            }); // cancelling orders when another large graph is seen

            downtrendCalculator(high, low, close);

            //3 cases, 
            //1. goes up then back down
            //2. goes back up, usually from previous close straight up 
            //3. only goes down  



            //this is retracement 38.2%
            pushMessage('INITIAL SELL 38.2% ORDER', `Going to submit limit sell at $${ret2}`); //sell order need to sell before buy otherwise dont buy
            pushMessage('FOLLOWING BUY 38.2% ORDER', `Going to submit limit buy at $${close}`); //buy order

            submitTrade('sell', '0.005', ret2.toFixed(2).toString(), '38.2');
            
            followingOrder38 = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'buy',
                size: '0.005',
                price: close.toFixed(2).toString()
            };




            //this is special stop order needed to get rightvalue at first
            stackMaxPos = [];
            maxVolume = 0;
      
            for (let i = 1; i < 25; i++){
                if (book.state().asks[i].totalSize.toNumber() > maxVolume){
                    maxVolume = book.state().asks[i].totalSize.toNumber();
                    stackMaxPos.push(i);
                   
                }
            }

            console.log("\n Number right below: " + book.state().asks[stackMaxPos[stackMaxPos.length - 1] - 1].price.toNumber());
            console.log("\n LOOKING AT: " + book.state().asks[stackMaxPos[stackMaxPos.length - 1]].price.toNumber());
           

            console.log("LENGTH OF STACKMAXPOS: " + stackMaxPos.length);
            for (let j = 0; j < stackMaxPos.length; j++){
                posToChoose = stackMaxPos.pop();
                if (book.state().asks[posToChoose].price.sub(book.state().asks[posToChoose - 1].price).toNumber() > .01){
                    console.log("\n Number right below: " + book.state().asks[posToChoose - 1].price.toNumber());
                    console.log("\n CHOOSING THIS - 0.01: " + book.state().asks[posToChoose].price.toNumber());
                    stopOrderPrice = book.state().asks[posToChoose].price.toNumber() - 0.01;
                    submitStopTrade('buy', '0.005', stopOrderPrice.toFixed(2).toString(), '10.0', stopOrderPrice.toFixed(2).toString(), 'entry');
                    break;
                }
                
                
            }

            console.log("LENGTH OF STACKMAXPOS AFTER POP: " + stackMaxPos.length);

            pushMessage('INITIAL BUY 10.0% ORDER', `Going to submit limit buy at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes up straight
            pushMessage('FOLLOWING SELL 10.0% ORDER', `Going to submit limit sell at $${ret5}`); //sell
            
            followingOrder10 = {
                type: 'placeOrder',
                time: new Date(),
                productId: product,
                orderType: 'limit',
                side: 'sell',
                size: '0.005',
                price: ret5.toFixed(2).toString()
            };




            //this is extension 100% - incase a big jump
            pushMessage('BUY 100% ORDER', `Going to submit limit buy at $${ext5}`); //if it goes down only

            submitTrade('buy', '0.005', ext5.toFixed(2).toString(), '100');





            //Print Statements 
            console.log('SELL ORDER 38.2', `Going to submit limit sell at $${ret2}`); //sell order need to sell before buy otherwise dont buy
            console.log('BUY ORDER 38.2', `Going to submit limit buy at $${close}`); //buy order
            console.log('BUY ORDER 10.0', `Going to submit limit sell at $${stopOrderPrice.toFixed(2).toString()}`); //if it goes down slightly then goes up
            console.log('SELL ORDER 10.0', `Going to submit limit buy at $${ret5}`); //buy     
            console.log('BUY ORDER 100', `Going to submit limit sell at $${ext5}`); //if it goes down only


           
       
        }

        global5MinuteCounter = Date.now();
        openBoolean = false;
       

        pushMessage('Price Trigger', `OPEN 5 MINS: ${open} \n HIGH 5 MINS: ${high} \n LOW 5 MINS: ${low} \n CLOSE 5 MINS: ${close}`);
        console.log('Price Trigger', `OPEN 5 MINS: ${open} \n HIGH 5 MINS: ${high} \n LOW 5 MINS: ${low} \n CLOSE 5 MINS: ${close}`);

        high = 0;
        low = 99999;



    }
    
    
    
}



function uptrendCalculator(high: number, low: number, close: number) {
    
            
    let difference = high - low;

    ret1 = high - (difference * 0.10); //using this for straight down , CUSTOM MADE-- NOT USING ANYMORE, FILLED AUTOMATICALLY
    ret2 = high - (difference * 0.382); //using this one for down then up
    ret3 = high - (difference * 0.5);
    ret4 = high - (difference * 0.618);
    ret5 = high - (difference * 0.90); //CUSTOM MADE
    ret6 = high - (difference * 1);
    ret7 = high - (difference * 1.382);

    
    ext1 = close + (difference * 2.618);
    ext2 = close + (difference * 2);
    ext3 = close + (difference * 1.618);
    ext4 = close + (difference * 1.382);
    ext5 = close + (difference * 1);    //using this for hail mary straight up 
    ext6 = close + (difference * 0.618);
    ext7 = close + (difference * 0.5);
    ext8 = close + (difference * 0.382);
    ext9 = close + (difference * 0.236);
    
            
}

function downtrendCalculator(high: number, low: number, close: number) {
    
            
    let difference = high - low;

    ret1 = low + (difference * 0.10); //using this for straight up , CUSTOM MADE-- NOT USING ANYMORE, FILLED AUTOMATICALLY
    ret2 = low + (difference * 0.382); //using this one for up then down
    ret3 = low + (difference * 0.5);
    ret4 = low + (difference * 0.618);
    ret5 = low + (difference * 0.90); //CUSTOM MADE 
    ret6 = low + (difference * 1);
    ret7 = low + (difference * 1.382);

    
    ext1 = close - (difference * 2.618);
    ext2 = close - (difference * 2);
    ext3 = close - (difference * 1.618);
    ext4 = close - (difference * 1.382);
    ext5 = close - (difference * 1);    //using this for hail mary straight down 
    ext6 = close - (difference * 0.618);
    ext7 = close - (difference * 0.5);
    ext8 = close - (difference * 0.382);
    ext9 = close - (difference * 0.236);
    
            
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

   