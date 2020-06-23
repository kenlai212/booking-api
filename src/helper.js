const logger = require('./logger');
const fetch = require("node-fetch");
require('dotenv').config();

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
		.then(async (res) => {
			if (res.status >= 200 && res.status < 300) {
				response = await res.json();
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
		"refreshToken": global.refreshToken
	}
	
	var accessToken;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
		.then(async (res) => {
			if (res.status >= 200 && res.status < 300) {
				accessToken = await res.json();
			} else {
				logger.error("External Authentication Token API error : " + res.statusText);
				response.status = res.status;
				response.message = res.statusText;
				throw response;
			}
		});

	return accessToken;
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

/**
 * By : Ken Lai
 * Date : May 17, 2020
 * 
 * private function, call external api. 
 * 
 * If no global access toke available, call login api to get it
 * 
 * Then try to call target external api. Will retry once if failed. 
 * 
 * In the retry, if first external response code is 403-Forbidden,
 * that means the access token had expired.
 * 
 * It will then call helper.callTokenAPI and use refresh token in
 * memory to get a new access token.
 * 
 * Then it will retry to call external api again
 */
async function callAPI(url, requestAttr) {

	logger.info("Calling External API : " + url);

	//get accessToken if doesn't exist
	if (global.accessToken == null) {

		var loginResponse;

		await callLoginAPI()
			.then(response => {
				loginResponse = response;
			})
			.catch(err => {
				throw err;
			});

		global.accessToken = loginResponse.accessToken;
		logger.info("Obtained accessToken : " + global.accessToken);

		global.refreshToken = loginResponse.refreshToken;
		logger.info("Obtained refreshToken : " + global.refreshToken);
	}

	requestAttr.headers = {
		"Authorization": "Token " + global.accessToken,
		"content-Type": "application/json"
	}

	var response = new Object();
	var forbidden = false;
	var externalAPIError = false;
	await fetch(url, requestAttr)
		.then(async res => {
			if (res.status >= 200 && res.status < 300) {
				response = await res.json();

			} else if (res.status == 403) {
				forbidden = true;

			} else if (res.status == 400) {
				response.status = 400;
				var responseBody = await res.json()
				response.message = responseBody.error;
				throw response;
			} else {
				//external api error
				externalAPIError = true;
			}
		});

	//accessToken expired, callTokenAPI to obtain a new accessToken
	if (forbidden == true) {

		await callTokenAPI()
			.then(result => {
				global.accessToken = result.accessToken;
			});
		logger.info("Assigning new accessToken to global memory");
		

		//now there is a new accessToken, try again
		logger.info("trying again");
		requestAttr.headers = {
			"Authorization": "Token " + global.accessToken,
			"content-Type": "application/json"
		}
		await fetch(url, requestAttr)
			.then(async res => {
				if (res.status >= 200 && res.status < 300) {
					response = await res.json();

				} else if (res.status == 403) {
					logger.error("accessToken expried again!!!!!");

				} else if (res.status == 400) {
					response.status = 400;
					response.message = await res.json();
					throw response;

				} else {
					//external api error
					externalAPIError = true;
				}
			})
	}
	
	//got external api error, wait 200ms and try again
	if (externalAPIError == true) {

	}
	
	return response;
}

module.exports = {
	callLoginAPI,
	callTokenAPI,
	userAuthorization,
	callAPI
}