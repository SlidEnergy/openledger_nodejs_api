let account = "slidtrader1";
let asset = "OPEN.BTC";
let currency = "USD";

const path = require('path');
let Trader = require('./bitshares');//({ account: account, currency: currency, asset: asset, debug: true });


let trader = new Trader({ account: account, currency: currency, asset: asset, debug: true });

run();

async function run() {
	let orderVolume = 0.001;

	let orders = await trader.getOrders();

	let askandbid = getTheBestAskAndBid(orders, orderVolume);

	if(!askandbid || !askandbid.newAsk || !askandbid.newBid) {
		console.log("bestAsk и bestBid не определен.");
		return;
	}

	let { newAsk, newBid } = askandbid;

	if(!isProfitable(newAsk, newBid)) {
		console.log("Вычисленные bestAsk и bestBid не принесут прибыль.");
		return;
	}

	await trader.buy(orderVolume, newAsk);

	await trader.sell(orderVolume, newBid);
}

function isProfitable(newAsk, newBid) {
	
	//let fee = 0.0015; //USD
	//let fee = 0.01213; //BTS
	let fee = 0.0000002; //BTC

	let avgPrice = (newAsk + newBid) / 2;

	let profit = (Math.abs(newAsk - newBid) - fee * 2) / avgPrice;

	if(profit > 0)
		return true;
	else
		return false;
}

function getTheBestAskAndBid(orders, orderVolume) {

	let smallVolume = orderVolume * 0.1; // 10% от объема

	let asks = Object.keys(orders.asks).map(k=>parseFloat(k)).sort();
	let bids = Object.keys(orders.bids).map(k=>parseFloat(k)).sort((a,b) => a-b);

	let total = 0;

	let bestAsk = asks.find(element => {
		total = orders.asks[element].forSellConverted;

		return total > smallVolume;
	});

	total = 0;

	let bestBid = bids.find(element => {
		total = orders.bids[element].forSellConverted;

		return total > smallVolume;
	});

	if(!bestAsk || !bestBid) {
		return;
	}

 	let percentToBetterPrice = 0.0001; // 0.01 %

    let newAsk = bestAsk * (1 - percentToBetterPrice);
    let newBid = bestBid * (1 + percentToBetterPrice);

	return { newAsk: newAsk, newBid: newBid };
}