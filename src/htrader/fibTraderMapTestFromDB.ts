let mysql = require('mysql');

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "romper",
  database: "test_bitcoinapp"
});

// JUST HANDLING 90 TRADE. AND HIGH/LOW ones. NOT 38.2. WILL DO THAT IN NEW FILE.

let allData: Array<any> = [];


let difference5Min: number = 0;

let ret2FiveMin: number;
let ret5FiveMin: number;



let high5: number = 0; //important stuff
let low5: number = 0;
let open5: number = 0;
let close5: number = 0;
let time5: number = 0;

let candleAverage5Minutes: number = 0;

let bigCandle5: boolean = false;

let currentCash: number = 5000; //pretend cash in wallet
let currentBtc: number = 0.75; //pretend Btc in wallet
let profit: number = 0; //overall profit since beginning
const btcTradeAmount = 0.01; //CONSTANT - amount im trading in each trade
let currentWholeWalletAmount: number = 0;
const startWholeWalletAmount: number = currentCash + currentBtc*7950;
type SideAndValues = {initialTradeSide: string, initialTradeCashValue: number, initialTradeCounter: number, initialTradeTime: number, followingOrder38Side : string, followingOrder38Value : number, followingOrder90Side: string, followingOrder90Value: number};

let ordersMap: Map<number, SideAndValues> = new Map<number, SideAndValues>();

let timeCounter: number = 0;
let timeBetweenTradesTotal: number = 0;


function gatherData(): Promise<any> {
    return new Promise(function (resolve, reject){
        
        con.connect(function(err: any) {
            if (err) throw err;
            con.query("SELECT * FROM testdata", function (err: any, result: any, fields: any) {
            if (err) reject(err);
            resolve(result);
            //console.log(result);
            });
        });
    });
    
}


gatherData().then((result: any) => {
    allData = result;
    console.log("TIME: " + allData[0].TimeOfDay);
    console.log("LOW: " + allData[0].Low);
    console.log("HIGH: " + allData[0].High);
    console.log("OPEN: " + allData[0].OpenValue);
    console.log("CLOSE: " + allData[0].CloseValue);
    console.log("VOLUME: " + allData[0].Volume);
    practiceTrader();
})

function practiceTrader(){

    console.log(allData.length);

    for (let i = 288; i < 5000; i++){

        if (currentCash < 0 || currentBtc < 0){
            console.log("FAILED");
            console.log("MAP SIZE: " + ordersMap.size);
            console.log("START WHOLE WALLET: " + startWholeWalletAmount);
            console.log("time: " + allData[i].TimeOfDay);
            console.log("current cash: " + currentCash);
            currentWholeWalletAmount = currentCash + (currentBtc*close5);
            console.log("WHOLE WALLET: " + currentWholeWalletAmount);
            for (let [key, value] of ordersMap) {
                console.log(key, value);
            }
            process.exit(0);
        }
        
        open5 = allData[i].OpenValue;
        close5 = allData[i].CloseValue;
        high5 = allData[i].High;
        low5 = allData[i].Low;
        time5 = allData[i].TimeOfDay;
        // console.log("TIME: " + allData[i].TimeOfDay);
        // console.log("LOW: " + allData[i].Low);
        // console.log("HIGH: " + allData[i].High);
        // console.log("OPEN: " + allData[i].OpenValue);
        // console.log("CLOSE: " + allData[i].CloseValue);
        // console.log("VOLUME: " + allData[i].Volume);

        
        
        for (let [key, value] of ordersMap) {
            //console.log(key, value);
            let target: number = value.followingOrder90Value;

            if (target > low5 && target < high5){
                let initialCashValue: number = value.initialTradeCashValue;
                let initialCounter: number = value.initialTradeCounter;
                let initialSide: string = value.initialTradeSide;
                let thisTradeProfit: number = 0;
                if (initialSide == "SELL"){ //now youre buying
                    thisTradeProfit = initialCashValue - (initialCounter * btcTradeAmount)*target;
                    currentBtc += (initialCounter * btcTradeAmount);
                    currentCash -= (initialCounter * btcTradeAmount)*target;
                }
                else { //now youre selling
                    thisTradeProfit = (initialCounter * btcTradeAmount)*target - initialCashValue;
                    currentBtc -= (initialCounter * btcTradeAmount);
                    currentCash += (initialCounter * btcTradeAmount)*target;
                }
                profit += thisTradeProfit;
                timeCounter++;
                timeBetweenTradesTotal += time5 - value.initialTradeTime;
                //console.log("AVERAGE TIME: " + timeBetweenTradesTotal/timeCounter);
                console.log("PROFIT ON TRADE " + key + ": " + thisTradeProfit);
                console.log("OVERALL PROFIT: " + profit);
                ordersMap.delete(key);
            }
            
        }

        

        if (i == 4999){
            currentWholeWalletAmount = currentCash + (currentBtc*close5);
            console.log("time: " + allData[i].TimeOfDay);
            console.log("current cash: " + currentCash);
            console.log("START WHOLE WALLET: " + startWholeWalletAmount);
            console.log("END WHOLE WALLET: " + currentWholeWalletAmount);
            console.log("MAP SIZE: " + ordersMap.size);
            for (let [key, value] of ordersMap) {
                console.log(key, value);
            }
        }
        
        

        candleAverage5Minutes = findAverageOfCandles(i);

        fiveMinuteTrades(i);
        






    }


}

function fiveMinuteTrades(tradeId: number){

    let initialTradeCashValue: number = 0;
    let initialTradSide: string = "";
    let initialTradeCounter: number = 0;
    let followingOrder90Side: string = "";
    let followingOrder90Value: number = 0;


    if ((close5 > open5) && ((close5 - open5) > (candleAverage5Minutes-5))){ //green bar, price went up
        
        bigCandle5 = true;
        uptrendCalculator();

        followingOrder90Side = "BUY";
        followingOrder90Value = ret5FiveMin;

        initialTradSide = "SELL";
        initialTradeCashValue = btcTradeAmount * (open5 + (candleAverage5Minutes-5));
        initialTradeCounter++; 
        currentBtc -= btcTradeAmount;
        currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes-5));

        if ((close5 - open5) > candleAverage5Minutes){
            initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes);
            initialTradeCounter++; 
            currentBtc -= btcTradeAmount;
            currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes));
        }
        if ((close5 - open5) > (candleAverage5Minutes+5)){
            initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+5);
            initialTradeCounter++; 
            currentBtc -= btcTradeAmount;
            currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+5));
        }
        if ((close5 - open5) > (candleAverage5Minutes+10)){
            initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+10);
            initialTradeCounter++; 
            currentBtc -= btcTradeAmount;
            currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+10));
        }
        if ((close5 - open5) > (candleAverage5Minutes+15)){
            initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+15);
            initialTradeCounter++; 
            currentBtc -= btcTradeAmount;
            currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+15));
        }       

        console.log("CURRENT CASH: " + currentCash);
        console.log("CURRENT BTC: " + currentBtc);
        console.log("CURRENT PROFIT: " + profit);

    }
        
    else if ((open5 > close5) && ((open5 - close5) > (candleAverage5Minutes-5))){ //red bar, price went down
        
             
        bigCandle5 = true;
        downtrendCalculator();

        followingOrder90Side = "SELL";
        followingOrder90Value = ret5FiveMin;

        initialTradSide = "BUY";
        initialTradeCashValue = btcTradeAmount * (open5 - (candleAverage5Minutes-5));
        initialTradeCounter++; 
        currentBtc += btcTradeAmount;
        currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes-5));

        if ((open5 - close5) > candleAverage5Minutes){
            initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes);
            initialTradeCounter++; 
            currentBtc += btcTradeAmount;
            currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes));
        }
        if ((open5 - close5) > (candleAverage5Minutes+5)){
            initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+5);
            initialTradeCounter++; 
            currentBtc += btcTradeAmount;
            currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+5));
        }
        if ((open5 - close5) > (candleAverage5Minutes+10)){
            initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+10);
            initialTradeCounter++; 
            currentBtc += btcTradeAmount;
            currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+10));
        }
        if ((open5 - close5) > (candleAverage5Minutes+15)){
            initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+15);
            initialTradeCounter++; 
            currentBtc += btcTradeAmount;
            currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+15));
        }

        console.log("CURRENT CASH: " + currentCash);
        console.log("CURRENT BTC: " + currentBtc);
        console.log("CURRENT PROFIT: " + profit);
            
    }

    if (bigCandle5 == false){
        if (close5 > open5){
            if ((high5 - open5) > (candleAverage5Minutes-5)){
                initialTradSide = "SELL";
                initialTradeCashValue = btcTradeAmount * (open5 + (candleAverage5Minutes-5));
                initialTradeCounter++; 
                currentBtc -= btcTradeAmount;
                currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes-5));
                if ((high5 - open5) > candleAverage5Minutes){
                    initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes);
                    initialTradeCounter++; 
                    currentBtc -= btcTradeAmount;
                    currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes));
                }
                if ((high5 - open5) > (candleAverage5Minutes+5)){
                    initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+5);
                    initialTradeCounter++; 
                    currentBtc -= btcTradeAmount;
                    currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+5));
                }
                if ((high5 - open5) > (candleAverage5Minutes+10)){
                    initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+10);
                    initialTradeCounter++; 
                    currentBtc -= btcTradeAmount;
                    currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+10));
                }
                if ((high5 - open5) > (candleAverage5Minutes+15)){
                    initialTradeCashValue += btcTradeAmount * (open5 + candleAverage5Minutes+15);
                    initialTradeCounter++; 
                    currentBtc -= btcTradeAmount;
                    currentCash += btcTradeAmount * (open5 + (candleAverage5Minutes+15));
                }
                followingOrder90Side = "BUY";
                followingOrder90Value = close5 - 2;
            }
            
        }
        else if (open5 > close5) {
            if ((open5 - low5) > (candleAverage5Minutes-5)){
                initialTradSide = "BUY";
                initialTradeCashValue = btcTradeAmount * (open5 - (candleAverage5Minutes-5));
                initialTradeCounter++; 
                currentBtc += btcTradeAmount;
                currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes-5));
                if ((open5 - low5) > candleAverage5Minutes){
                    initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes);
                    initialTradeCounter++; 
                    currentBtc += btcTradeAmount;
                    currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes));
                }
                if ((open5 - low5) > (candleAverage5Minutes+5)){
                    initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+5);
                    initialTradeCounter++; 
                    currentBtc += btcTradeAmount;
                    currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+5));
                }
                if ((open5 - low5) > (candleAverage5Minutes+10)){
                    initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+10);
                    initialTradeCounter++; 
                    currentBtc += btcTradeAmount;
                    currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+10));
                }
                if ((open5 - low5) > (candleAverage5Minutes+15)){
                    initialTradeCashValue += btcTradeAmount * (open5 - candleAverage5Minutes+15);
                    initialTradeCounter++; 
                    currentBtc += btcTradeAmount;
                    currentCash -= btcTradeAmount * (open5 - (candleAverage5Minutes+15));
                }
                followingOrder90Side = "SELL";
                followingOrder90Value = close5 + 2;
            }
            

        }
        
        
    }


    let sideAndValues: SideAndValues = {
        initialTradeSide: initialTradSide,  
        initialTradeCashValue: initialTradeCashValue, 
        initialTradeCounter: initialTradeCounter,
        initialTradeTime: time5, 
        followingOrder38Side: "",
        followingOrder38Value: 0,
        followingOrder90Side: followingOrder90Side,
        followingOrder90Value: followingOrder90Value
    };
    if (followingOrder90Value > 0){
        ordersMap.set(tradeId, sideAndValues);
    }
    bigCandle5 = false;

}


function findAverageOfCandles(i: number): number {


    let numArray = new Array(20).fill(0); //declaring variables to begin average 
    let average = 0;
    let averageCounter = 0;
    for (let z = i - 121; z < i ; z++){ //finding avergage of past 10 hours here 
        let openForAverage = allData[z].OpenValue;
        let closeForAverage = allData[z].CloseValue;
        if (Math.abs(openForAverage - closeForAverage) > 10){    //everything above 10 because 5 minute candles arent so big
            average += Math.abs(openForAverage - closeForAverage);
            averageCounter++;
            //console.log("AVG: " + average);
            if (Math.abs(openForAverage - closeForAverage) < 100){
                let tens = Math.floor((Math.abs(openForAverage - closeForAverage)/10) % 10);
                numArray[tens]++;
            }
            else if (Math.abs(openForAverage - closeForAverage) >= 100 && Math.abs(openForAverage - closeForAverage) < 200){
                let hundreds = Math.floor((Math.abs(openForAverage - closeForAverage)/10));
                numArray[hundreds]++;
            }

        }
        

      
    }


    //let finalAverage = average/averageCounter;
    //console.log("FINAL AVERAGE: " + finalAverage);
   
    let newAverageTotal = 0;
    let newCounter = 0;

    
    for (let j = 0; j < numArray.length; j++){
        //console.log("FILLED ARRAY: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
        //send("FILLED ARRAY: VAL: " + j*10 + " AND AMOUNT: " + numArray[j]);
        if (numArray[j] > 0){
            newAverageTotal += (numArray[j] * (j*10));
            newCounter += numArray[j];
        }
    }

    let candleAverage = newAverageTotal/newCounter;
    //console.log("NEW AVERAGE: " + newAverageTotal/newCounter);
    return candleAverage;
}




function uptrendCalculator() {
    
    
    
    difference5Min = close5 - open5;
    ret2FiveMin = close5 - (difference5Min * 0.382); //using this one for down then up
    ret5FiveMin = close5 - (difference5Min * 0.90); //CUSTOM MADE
   
    
    
            
}

function downtrendCalculator() {
    
        
    difference5Min = open5 - close5;
    ret2FiveMin = close5 + (difference5Min * 0.382);  //using this one for up then down
    ret5FiveMin = close5 + (difference5Min * 0.90); //CUSTOM MADE 
     
    

  
    
            
}