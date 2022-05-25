"use strict";
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
const moment = require("moment");

const DOMAIN = "localhost";
//const DOMAIN = "lipslide.co";
const BOOKING_DOMAIN_URL = `http://${DOMAIN}:1239/booking-api`;

const MONGO_DOMAIN = "mongodb://localhost:27017";
//const MONGO_DOMAIN = "mongodb://kenlai212:Maxsteel1596@docdb-2022-02-07-11-30-33.cluster-crlpdnkevaqy.ap-southeast-1.docdb.amazonaws.com:27017";
const MONGO_CERT_PATH = "/home/ec2-user/certs/rds-combined-ca-bundle.pem"; 
const BOOKING_MONGO_DB_URL = `${MONGO_DOMAIN}/booking`;

const AXIO_REQUEST_CONFIG = {headers:{'Authorization': `token ${getAccessToken()}`}}

function getAccessToken() {
	const userObject = {
		userId: "TESTER1",
		personId: "Tester 1",
		userStatus: "ACTIVE",
		groups: [
			"AUTHENTICATION_ADMIN",
			"BOOKING_ADMIN",
			"PRICING_USER",
			"OCCUPANCY_ADMIN",
			"NOTIFICATION_USER",
			"USER_ADMIN",
			"ASSET_ADMIN",
			"STAFF_ADMIN",
			"PERSON_ADMIN",
			"CUSTOMER_ADMIN",
			"INVOICE_ADMIN",
			"TIMESHEET_ADMIN",
			"ACCOUNTING_ADMIN"]
	}

	try {
		return jwt.sign(userObject, "azize-lights");
	} catch (err) {
		console.error(err);
		console.error("Error while signing access token for Booking API System User", err);
		throw err;
	}
}

async function flushAllCollections(){
    try{
        initMongoDb(BOOKING_MONGO_DB_URL);
        await mongoose.connection.dropCollection('wakesurfbookings');
        await mongoose.connection.dropCollection('staffs');
        await mongoose.connection.close();
     }catch(error){
         console.error(`Mongoose Connection Error: ${error}`);
         //throw error;	
     }
}

async function createS123Staff(){
    const postStaffRequest = {
        staffId:"S123",
        status:"ACTIVE",
        name:"Test Staff",
        countryCode:"852",
        phoneNumber:"12345678"
     }
     await axios.post(`${BOOKING_DOMAIN_URL}/staff`, postStaffRequest, AXIO_REQUEST_CONFIG);
}

function initMongoDb(connUrl){
    let connOptions;
    if(MONGO_DOMAIN != "mongodb://localhost:27017"){
        connOptions = {
            useUnifiedTopology: true, 
            useNewUrlParser: true,
            ssl: true,
            sslValidate: false,
            sslCA: MONGO_CERT_PATH
        }
    }else{
        connOptions = {
            "useUnifiedTopology": true, 
            "useNewUrlParser": true
        }
    }

    try{
        mongoose.connect(connUrl, connOptions);
    }catch(error){
		console.error(error);	
    }
}

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

function getYesterdayNineAMDate(){
    const yesterdayEightAm = moment().utcOffset(8).add(-1,"days").set({hour:9,minute:0,second:0,millisecond:0}).toDate();
    return yesterdayEightAm;
}

function getTomorrowSevenAmDate(){
    const tomorrowSevenAm = moment().utcOffset(8).add(1,"days").set({hour:7,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowSevenAm;
}

module.exports = {
    BOOKING_DOMAIN_URL,
    AXIO_REQUEST_CONFIG,
    flushAllCollections,
    createS123Staff,
    getTomorrowEightAMDate,
    getTomorrowNineAMDate,
	getTomorrowTenAMDate,
    getTomorrowElevenAMDate,
    getYesterdayEightAMDate,
	getYesterdayNineAMDate,
    getTomorrowSevenAmDate
}