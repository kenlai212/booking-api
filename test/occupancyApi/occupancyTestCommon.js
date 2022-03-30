"use strict";
const moment = require("moment");
const DOMAIN = "localhost";
const OCCUPANCY_DOMAIN_URL = `http://${DOMAIN}:1237/occupancy-api`;
const MONGO_DB_URL = "mongodb://localhost:27017/occupancy";

function getTomorrowEightAMDate(){
    const tomorrowEightAm = moment().utcOffset(8).add(1,"days").set({hour:8,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowEightAm;
}

function getTomorrowNineAMDate(){
    const tomorrowNineAm = moment().utcOffset(8).add(1,"days").set({hour:9,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowNineAm;
}

function getTomorrowTenAMDate(){
    const tomorrowTenAm = moment().utcOffset(8).add(1,"days").set({hour:10,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowTenAm;
}

function getTomorrowElevenAMDate(){
    const tomorrowElevenAm = moment().utcOffset(8).add(1,"days").set({hour:11,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowElevenAm;
}

function getYesterdayEightAMDate(){
    const yesterdayEightAm = moment().utcOffset(8).add(-1,"days").set({hour:8,minute:0,second:0,millisecond:0}).toDate();
    return yesterdayEightAm;
}

function getTomorrowSevenAmDate(){
    const tomorrowSevenAm = moment().utcOffset(8).add(1,"days").set({hour:7,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowSevenAm;
}

module.exports = {
    OCCUPANCY_DOMAIN_URL,
    MONGO_DB_URL,
    getTomorrowEightAMDate,
    getTomorrowNineAMDate,
    getTomorrowTenAMDate,
    getTomorrowElevenAMDate,
    getYesterdayEightAMDate,
    getTomorrowSevenAmDate
}