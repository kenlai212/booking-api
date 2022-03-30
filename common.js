"use strict";
const moment = require("moment");
const jwt = require("jsonwebtoken");

//const DOMAIN = "ec2-16-162-118-236.ap-east-1.compute.amazonaws.com";
const DOMAIN = "localhost";
const OCCUPANCY_DOMAIN_URL = `http://${DOMAIN}:1237/api`;
const BOOKING_DOMAIN_URL = `http://${DOMAIN}:1238/api`;

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
			"INVOICE_ADMIN"]
	}

	try {
		return jwt.sign(userObject, "azize-lights");
	} catch (err) {
		console.error(err);
		console.error("Error while signing access token for Booking API System User", err);
		throw err;
	}
}

function sleep(milliseconds) {
    const date = Date.now();
    
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function getTomorrowEightAMDate(){
    const tomorrowEightAm = moment().utcOffset(8).add(1,"days").set({hour:8,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowEightAm;
}

function getTomorrowNineAMDate(){
    const tomorrowNineAm = moment().utcOffset(8).add(1,"days").set({hour:9,minute:0,second:0,millisecond:0}).toDate();
    return tomorrowNineAm;
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
    getAccessToken,
    OCCUPANCY_DOMAIN_URL,
	BOOKING_DOMAIN_URL,
	sleep,
	getTomorrowEightAMDate,
    getTomorrowNineAMDate,
    getYesterdayEightAMDate,
    getTomorrowSevenAmDate
}