import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { StockDisplayService } from '../_services/stock-display.service';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import * as Highcharts from "highcharts/highstock";
import { Options } from "highcharts";

import IndicatorsCore from "highcharts/indicators/indicators";
import vbp from "highcharts/indicators/volume-by-price";
import IndicatorZigzag from "highcharts/indicators/zigzag";

@Component({
    selector: 'app-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {
    ticker: string;
    stockNews: Object;
    summary: object;
    details: Object;
    isLoading: boolean = true;
    tickerInvalid: boolean = false;
    graphColor: string;
    quantity: number = 0;
    current_news: Object;
    twitter_text: string;
    watchlistPresent: boolean = false;
    workingModal;
    summaryTabCharts: number[][];
    smaVolume: number[][];
    smaOHLC: number[][];
    boughtString: string = '';
    removedString: string = '';
    addedWatchlistString: string = '';
    watchlistString: string = '';
    buyTimeout;
    watchlistTimeout;
    showBuy: boolean = false;
    lastPrice: number;
    updateChart: boolean = true;

    Highcharts: typeof Highcharts = Highcharts;

    chartOptionsSummaryChart: Options = {};
    chartOptionsSmaVolume: Options = {};
    constructor(private _activatedRouter: ActivatedRoute, private _http: StockDisplayService,
        private config: NgbModalConfig, private modalService: NgbModal) {
        IndicatorsCore(Highcharts);
        IndicatorZigzag(Highcharts);
        vbp(Highcharts);
        config.backdrop = 'static';
        config.keyboard = false;
    }

    ngOnInit(): void {
        this.ticker = this._activatedRouter.snapshot.paramMap.get('id');
        this.boughtString = this.ticker + ' bought successfully!';
        this.addedWatchlistString = this.ticker + ' added to Watchlist.';
        this.removedString = this.ticker + ' removed from Watchlist.';
        var testWatchList = JSON.parse(localStorage.getItem("Watchlist"));
        if (testWatchList != null && this.ticker in testWatchList)
            this.watchlistPresent = true;
        this._http.getAllDetails(this.ticker)
            .pipe(
                debounceTime(220)
            )
            .subscribe(
                data => {
                    if ('error' in data) {
                        this.tickerInvalid = true;
                        this.isLoading = false;
                    }
                    else {
                        // change display as per requirement
                        var nfObject = new Intl.NumberFormat('en-US');

                        this.details = data['details'];

                        // storing the value of last price in a global variable that is in float
                        this.lastPrice = this.details['last'];

                        this.details['last'] = nfObject.format(this.details['last']);
                        this.details['change'] = nfObject.format(this.details['change'].toFixed(2));
                        this.details['changePercentage'] = nfObject.format(this.details['changePercentage'].toFixed(2));

                        this.summary = data['summary'];
                        this.summary['highPrice'] = nfObject.format(this.summary['highPrice']);
                        this.summary['lowPrice'] = nfObject.format(this.summary['lowPrice']);
                        this.summary['openPrice'] = nfObject.format(this.summary['openPrice']);
                        this.summary['prevClose'] = nfObject.format(this.summary['prevClose']);
                        this.summary['volume'] = nfObject.format(this.summary['volume']);


                        if (this.details['marketStatus'] == 'open') {
                            if (this.summary['midPrice'] != '-')
                                this.summary['midPrice'] = nfObject.format(this.summary['midPrice']);
                            if (this.summary['askPrice'] != '-')
                                this.summary['askPrice'] = nfObject.format(this.summary['askPrice']);
                            if (this.summary['askSize'] != '-')
                                this.summary['askSize'] = nfObject.format(this.summary['askSize']);
                            if (this.summary['bidSize'] != '-')
                                this.summary['bidSize'] = nfObject.format(this.summary['bidSize']);
                            if (this.summary['bidPrice'] != '-')
                                this.summary['bidPrice'] = nfObject.format(this.summary['bidPrice']);
                        }
                        this.stockNews = data['newsArticles'];
                        this.summaryTabCharts = data['summaryTabCharts'];
                        this.smaVolume = data['sma_volume'];
                        this.smaOHLC = data['sma_ohlc'];
                        this.details['currentTimestamp'] = this.formatDate(new Date());
                        this.details['lastTimestamp'] = this.formatDate(new Date(this.details['lastTimestamp']));
                        this.graphColor = parseFloat(this.details['change']) > 0 ? 'green' : parseFloat(this.details['change']) < 0 ? 'red' : 'black';
                        this.isLoading = false;

                        this.updateChart = false;

                        this.chartOptionsSummaryChart = {
                            rangeSelector: {
                                enabled: false
                            },
                            title: {
                                text: this.details['ticker']
                            },
                            yAxis: {
                                labels: {
                                    align: 'left',
                                    x: -30
                                }
                            },
                            time: {
                                timezoneOffset: new Date(Date.now()).getTimezoneOffset()
                            },
                            navigator: {
                                series: {
                                    fillOpacity: 0.05,
                                    color: this.graphColor,
                                }
                            },
                            series: [
                                {
                                    id: this.details['ticker'],
                                    type: 'zigzag',
                                    tooltip: {
                                        valueDecimals: 2
                                    },
                                    name: this.details["ticker"],
                                    data: this.summaryTabCharts,
                                    color: this.graphColor
                                }
                            ]
                        }
                        this.chartOptionsSmaVolume = {
                            rangeSelector: {
                                selected: 2
                            },
                            title: {
                                text: this.details["ticker"] + ' Historical'
                            },
                            subtitle: {
                                text: 'With SMA and Volume by Price technical indicators'
                            },
                            yAxis: [{
                                startOnTick: false,
                                endOnTick: false,
                                labels: {
                                    align: 'right',
                                    x: -3
                                },
                                title: {
                                    text: 'OHLC'
                                },
                                height: '60%',
                                lineWidth: 2,
                                resize: {
                                    enabled: true
                                }
                            }, {
                                labels: {
                                    align: 'right',
                                    x: -3
                                },
                                title: {
                                    text: 'Volume'
                                },
                                top: '65%',
                                height: '35%',
                                offset: 0,
                                lineWidth: 2
                            }],

                            tooltip: {
                                split: true
                            },
                            series: [{
                                type: 'candlestick',
                                name: this.details["ticker"],
                                id: this.details["ticker"],
                                zIndex: 2,
                                data: this.smaOHLC
                            }, {
                                type: 'column',
                                name: 'Volume',
                                id: 'volume',
                                data: this.smaVolume,
                                yAxis: 1
                            }, {
                                id: this.details['ticker'],
                                type: 'vbp',
                                linkedTo: this.details['ticker'],
                                params: {
                                    volumeSeriesID: 'volume'
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                zoneLines: {
                                    enabled: false
                                }
                            }, {
                                id: this.details['ticker'],
                                type: 'sma',
                                linkedTo: this.details['ticker'],
                                zIndex: 1,
                                marker: {
                                    enabled: false
                                }
                            }]
                        }
                    }
                }
            )
        setInterval(() => {
            this.updateDetails()
        }, 15000)
    }
    openModal(index, content) {
        this.current_news = this.stockNews[index];
        this.twitter_text = encodeURIComponent(this.current_news['title']) + '%20' + encodeURIComponent(this.current_news['url']);
        this.modalService.open(content);
    }
    openBuyModal(content) {
        this.quantity = 0;
        this.workingModal = this.modalService.open(content);
    }
    buyStockFunc() {
        this.showBuy = true;
        clearTimeout(this.buyTimeout);
        this.buyTimeout = setTimeout(() => {
            this.showBuy = false;
        }, 5000);
        var portfolioData = JSON.parse(localStorage.getItem("Portfolio"));
        var stockPurchased: Object = {
            "companyName": this.details["name"],
            "totalAmountShares": parseFloat((this.quantity * this.lastPrice).toFixed(2)),
            "noOfStocks": this.quantity,
            "avgCostPerShare": this.lastPrice
        }
        if (portfolioData == null) {
            var stockPurchasedTemp: Object = {};
            stockPurchasedTemp[this.ticker] = stockPurchased;
            portfolioData = stockPurchasedTemp;
            localStorage.setItem("Portfolio", JSON.stringify(portfolioData));
        }
        else {
            portfolioData = JSON.parse(localStorage.getItem("Portfolio"));
            if (portfolioData.hasOwnProperty(this.ticker)) {
                var previousStockData = portfolioData[this.ticker];
                previousStockData["noOfStocks"] = parseFloat((previousStockData["noOfStocks"] + stockPurchased["noOfStocks"]).toFixed(2));
                previousStockData["totalAmountShares"] = parseFloat((previousStockData["totalAmountShares"] + stockPurchased["totalAmountShares"]).toFixed(2));
                previousStockData["avgCostPerShare"] = parseFloat((previousStockData["totalAmountShares"] / previousStockData["noOfStocks"]).toFixed(2));
                portfolioData[this.ticker] = previousStockData;
            }
            else {
                portfolioData[this.ticker] = stockPurchased;
            }
            localStorage.setItem("Portfolio", JSON.stringify(portfolioData));
        }
        this.quantity = 0;
        this.workingModal.close();
    }

    checkWatchlist(ticker) {
        var watchlistData = JSON.parse(localStorage.getItem("Watchlist"));
        if (watchlistData == null) {
            this.watchlistPresent = false;
            localStorage.setItem("Watchlist", JSON.stringify({}));
            return;
        }
        watchlistData = JSON.parse(localStorage.getItem("Watchlist"));

        if (watchlistData.hasOwnProperty(ticker)) {
            this.watchlistPresent = true;
            return;
        }
        else {
            this.watchlistPresent = false;
        }
    }
    onStarClick() {
        this.checkWatchlist(this.ticker);
        if (!this.watchlistPresent) {
            this.watchlistString = "add";
            clearTimeout(this.watchlistTimeout);
            this.watchlistTimeout = setTimeout(() => {
                this.watchlistString = "";
            }, 5000);
            var watchlistData = JSON.parse(localStorage.getItem("Watchlist"));
            watchlistData[this.ticker] = this.details["name"];
            localStorage.setItem("Watchlist", JSON.stringify(watchlistData));
            this.watchlistPresent = true;
        }
        else {
            this.watchlistString = "remove";
            clearTimeout(this.watchlistTimeout);
            this.watchlistTimeout = setTimeout(() => {
                this.watchlistString = "";
            }, 5000);
            var watchlistData = JSON.parse(localStorage.getItem("Watchlist"));
            delete watchlistData[this.ticker];
            localStorage.setItem("Watchlist", JSON.stringify(watchlistData));
            this.watchlistPresent = false;
        }
    }

    updateDetails() {

        if (this.details != null && this.details['marketStatus'] == 'open') {
            this._http.getAllDetailsRepeat(this.ticker)
                .pipe(
                    debounceTime(350)
                )
                .subscribe(data => {
                    if ("error" in data) {
                        this.tickerInvalid = false;
                    }
                    else {
                        // console.log('UPDATING AFTER 15 SECONDS');
                        // change display as per requirement
                        var nfObject = new Intl.NumberFormat('en-US');
                        this.details = data['details'];

                        // storing the value of last price in a global variable that is in float
                        this.lastPrice = this.details['last'];

                        this.details['last'] = nfObject.format(this.details['last']);
                        this.details['change'] = nfObject.format(this.details['change'].toFixed(2));
                        this.details['changePercentage'] = nfObject.format(this.details['changePercentage'].toFixed(2));

                        this.summary = data['summary'];
                        this.summary['highPrice'] = nfObject.format(this.summary['highPrice']);
                        this.summary['lowPrice'] = nfObject.format(this.summary['lowPrice']);
                        this.summary['openPrice'] = nfObject.format(this.summary['openPrice']);
                        this.summary['prevClose'] = nfObject.format(this.summary['prevClose']);
                        this.summary['volume'] = nfObject.format(this.summary['volume']);

                        if (this.details['marketStatus'] == 'open') {
                            if (this.summary['midPrice'] != '-')
                                this.summary['midPrice'] = nfObject.format(this.summary['midPrice']);
                            if (this.summary['askPrice'] != '-')
                                this.summary['askPrice'] = nfObject.format(this.summary['askPrice']);
                            if (this.summary['askSize'] != '-')
                                this.summary['askSize'] = nfObject.format(this.summary['askSize']);
                            if (this.summary['bidSize'] != '-')
                                this.summary['bidSize'] = nfObject.format(this.summary['bidSize']);
                            if (this.summary['bidPrice'] != '-')
                                this.summary['bidPrice'] = nfObject.format(this.summary['bidPrice']);
                        }

                        this.details['currentTimestamp'] = this.formatDate(new Date());
                        this.details['lastTimestamp'] = this.formatDate(new Date(this.details['lastTimestamp']));
                        this.summary = data['summary'];
                        this.summaryTabCharts = data['summaryTabCharts'];
                        this.graphColor = parseFloat(this.details['change']) > 0 ? 'green' : parseFloat(this.details['change']) < 0 ? 'red' : 'black';
                        this.chartOptionsSummaryChart.series[0]['data'] = this.summaryTabCharts;
                        this.chartOptionsSummaryChart.series[0]['color'] = this.graphColor;
                        this.chartOptionsSummaryChart.navigator.series['color'] = this.graphColor;
                        this.updateChart = true;
                    }
                }
                )
        }
    }

    formatDate(date) {
        var minutes = date.getMinutes().toString().padStart(2, '0');
        var hours = date.getHours().toString().padStart(2, '0');
        var seconds = date.getSeconds().toString().padStart(2, '0');
        var formatedDate = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + (date.getDate()).toString().padStart(2, '0')
            + " " + hours + ":" + minutes + ":" + seconds;
        return formatedDate;
    }
}