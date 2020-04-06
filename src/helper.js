const logger = require('./logger');
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {MissingMandateError, DBError, InvalidDataError} = require("./error");
require('dotenv').config();

function logIncommingRequest(req){
	logger.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
	logger.info("request user : " + req.user._id);
	logger.info("request body : " + JSON.stringify(req.body));
}

function logOutgoingResponse(res){
	logger.info(`${res.statusCode} ${res.statusMessage}`);
}

/********************************************************
extends start search range by 2 hrs
********************************************************/
function expandStartSearchRange(startTime){
	if(startTime == null){
		throw new MissingMandateError("startTime");
	}

	startTime.setTime(startTime.getTime() - (2*60*60*1000));

	return startTime;
}

/********************************************************
extends end search range by 2 hrs
********************************************************/
function expandEndSearchRange(endTime){
	if(endTime == null){
		throw new MissingMandateError("endTime");
	}

	endTime.setTime(endTime.getTime() + (2*60*60*1000));

	return endTime;
}

/*********************************************************
By : Ken Lai

Turn standard input date string -
YYYY-MM-DD HH:mm:ss into a UTC date
*********************************************************/
function standardStringToDate(dateStr){
	const year = dateStr.substring(0,4);
	const month = dateStr.substring(5,7);
	const date = dateStr.substring(8,10);
	const hour = dateStr.substring(11,13);
	const minute = dateStr.substring(14,16);
	const second = dateStr.substring(17,19);
	const dateTime = new Date(Date.UTC(year, month - 1, date, hour, minute, second, 0));

	if (isNaN(dateTime.getTime())){
		throw new InvalidDataError(dateStr);
	}
	
	return dateTime;
}

/*********************************************************
By : Ken Lai

Turn date into stardard output date string -
YYYY-MM-DD HH:mm:ss
**********************************************************/
function dateToStandardString(date){
	const year = date.getUTCFullYear();
	const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
	const day = ("0" + date.getUTCDate()).slice(-2);
	const hours = ("0" + date.getUTCHours()).slice(-2);
	const minutes = ("0" + date.getUTCMinutes()).slice(-2);
	const seconds = ("0" + date.getUTCSeconds()).slice(-2);

	const standardStr = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

	return standardStr;
}

/********************************************************
By : Ken Lai
Date : Apr 06 2020

call login api to obtain accessToken and refreshToken
********************************************************/
async function callLoginAPI() {
	const url = process.env.AUTHENTICATION_DOMAIN + process.env.LOGIN_SUBDOMAIN;
	const headers = {
		"content-Type": "application/json",
	}
	const data = {
		"loginId": process.env.AUTHENTICATION_API_LOGIN,
		"password": process.env.AUTHENTICATION_API_PASSWORD
	}

	var response;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
		.then((res) => {
			if (res.status >= 200 && res.status < 300) {
				response = res.json();
			} else {
				logger.error("External Authentication Login API error : " + res.statusText);
				response.status = res.status;
				response.message = res.statusText;
				throw response;
			}
		});

	return response;
}

/********************************************************
By : Ken Lai
Date : Apr 06 2020

call token api to obtain new accessToken from refreshToken
********************************************************/
async function callTokenAPI() {
	
	const url = process.env.AUTHENTICATION_DOMAIN + process.env.TOKEN_SUBDOMAIN;
	const headers = {
		"content-Type": "application/json",
	}
	const data = {
		"refreshToken": refreshToken
	}

	var response;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
		.then((res) => {
			if (res.status >= 200 && res.status < 300) {
				response = res.json();
			} else {
				logger.error("External Authentication Token API error : " + res.statusText);
				response.status = res.status;
				response.message = res.statusText;
				throw response;
			}
		});

	return response;
}

/********************************************************
By : Ken Lai
Date : Apr 06 2020

find if any entries in userGroups matches allowGroups
returns true/false
********************************************************/
function userAuthorization(userGroups, allowGroups) {
	const targetGroup = userGroups.filter(value => allowGroups.includes(value));

	if (targetGroup.length == 0) {
		return false;
	} else {
		return true;
	}
}

module.exports = {
	logIncommingRequest,
	logOutgoingResponse,
	expandStartSearchRange,
	expandEndSearchRange,
	standardStringToDate,
	dateToStandardString,
	callLoginAPI,
	callTokenAPI,
	userAuthorization
}