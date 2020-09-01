"use strict";
const common = require("gogowake-common");
const logger = common.logger;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Credentials = require("./credentials.model").Credentials;
const RefreshToken = require("./refresh-token.model").RefreshToken;

require('dotenv').config();
const PERSON_ACCESS_TOKEN_EXPIRES = "1h";
const SYSTEM_ACCESS_TOKEN_EXPIRES = "90d";
const PASSWORD_HASH_STRENGTH = 10;

const USER_PATH = "/user";

async function checkLoginIdAvailability(input) {
	var response = new Object;

	//validate loginId
	if (input.loginId == null || input.loginId.length < 1) {
		response.status = 400;
		response.message = "loginId is mandatory";
		throw response;
	}

	//check loginId availability
	var isAvailable = false;
	await Credentials.findOne({ "loginId": input.loginId })
		.then(result => {
			if (result == null) {
				isAvailable = true;
			}
		})
		.catch(err => {
			logger.error("Error while checking existingLoginId, running Credential.findOne() : " + err);
			response.status = 500;
			response.message = "Credential.findOne() is not available";
			throw response;
		});

	return { "isAvailable": isAvailable }
}

async function addNewCredentials(input) {
	var response = new Object;

	//validate loginId
	if (input.loginId == null || input.loginId.length < 1) {
		response.status = 400;
		response.message = "loginId is mandatory";
		throw response;
	}

	//check loginId availability
	var existingLoginId;
	await Credentials.findOne({ "loginId": input.loginId })
		.then(result => {
			existingLoginId = result;
		})
		.catch(err => {
			logger.error("Error while checking existingLoginId, running Credential.findOne() : " + err);
			response.status = 500;
			response.message = "Credential.findOne() is not available";
			throw response;
		});

	if (existingLoginId != null) {
		response.status = 400;
		response.message = "loginId not available";
		throw response;
	}

	//validate password
	if (input.password == null || input.password.length < 1) {
		response.status = 400;
		response.message = "password is mandatory";
		throw response;
	}

	//validate userId
	if (input.userId == null || input.userId.length < 1) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	var newCredentials = new Credentials();
	newCredentials.loginId = input.loginId;
	newCredentials.userId = input.userId;
	newCredentials.createdTime = new Date();
	//hash the password
	await bcrypt.hash(input.password, PASSWORD_HASH_STRENGTH)
		.then(result => {
			newCredentials.hashedPassword = result;
		})
		.catch(err => {
			logger.error("Error while hashing input.password, running bcrypt.hash() : " + err);
			response.status = 500;
			response.message = "bcrypt.hash() is not available";
			throw response;
		});
	
	await newCredentials.save()
		.then(result => {
			newCredentials = result;
			logger.info("Successfully saved new credentials : " + newCredentials.id);
		})
		.catch(err => {
			logger.error("Error while running newCredentials.save() : " + err);
			response.status = 500;
			response.message = "newCredentials.save() is not available";
			throw response;
		});

	//newCredentials.password = null;

	return newCredentials;
}

async function login(input){

	var response = new Object;
	var url;

	//must either be social user login or gogowake user login
	if ((input.provider == null || input.provider.length < 1) && (input.loginId == null || input.loginId.length < 1)) {
		response.status = 400;
		response.message = "provider or loginId is mandatory";
		throw response;
	}

	//social user login
	if (input.provider != null) {

		//validate providerUserId
		if (input.providerUserId == null || input.providerUserId.length < 1) {
			response.status = 400;
			response.message = "providerUserId is mandatory";
			throw response;
		}

		url = process.env.AUTHENTICATION_DOMAIN + USER_PATH + "?provider=" + input.provider + "&providerUserId=" + input.providerUserId;
	}

	//gogowake user login
	if (input.loginId != null) {
		//validate password
		if (input.password == null || input.password.length < 1) {
			response.status = 400;
			response.message = "password is mandatory";
			throw response;
		}

		//find credentials
		var credentials;
		await Credentials.findOne({ "loginId": input.loginId })
			.exec()
			.then(result => {
				credentials = result;
			})
			.catch(err => {
				logger.error("Error while running Credentials.findOne() : " + err);
				response.status = 500;
				response.message = "Credentials.findOne() not available";
				throw response;
			});

		if (credentials == null) {
			response.status = 401;
			response.message = "Login failed";
			throw response;
		}

		//compare password
		var passed = false;
		await bcrypt.compare(input.password, credentials.hashedPassword)
			.then(result => {
				passed = result
			})
			.catch(err => {
				logger.error("Error while running bcrypt.compare() : ", err);
				response.status = 500;
				response.message = "bcrypt.compare() not available";
				throw response;
			});

		if (passed == false) {
			response.status = 401;
			response.message = "Login failed";
			throw response;
		}

		url = process.env.AUTHENTICATION_DOMAIN + USER_PATH + "?userId=" + credentials.userId;
	}

	var user;

	//get user
	const requestAttr = {
		method: "GET",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		}
	}
	await common.callAPI(url, requestAttr)
		.then(result => {
			user = result;
		})
		.catch(err => {
			if (err.status = "404") {
				user = null;
			} else {
				logger.error("error while calling external user api : " + err);
				throw err;
			}
		});

	if (user == null) {
		logger.warn("Cannot find corrisponding user record");
		response.status = 400;
		response.message = "Login failed";
		throw response;
	}
	
	//generate access token
	var accessTokenStr;
	try {

		//set access token expires only for userType = PERSON_USER
		if (user.userType == "PERSON_USER") {
			accessTokenStr = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: PERSON_ACCESS_TOKEN_EXPIRES });
		} else if (user.userType == "SYSTEM_USER") {
			accessTokenStr = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: SYSTEM_ACCESS_TOKEN_EXPIRES });
        }
		
	} catch (err) {
		logger.error("Error while signing accessToken, running jwt.sign() : " + err);
		response.status = 500;
		response.message = "jwt.sign() not available";
		throw response;
	}
			
	/*
	see if there is already a refresh token assigned to this credentials
	if none, generate a new one
	if yes, return existing one
	*/
	var existingRefreshTokenObj;
	await RefreshToken.findOne({ "userId": user.id })
		.exec()
		.then(result => {
			existingRefreshTokenObj = result;
		})
		.catch(err => {
			logger.error("Error while finding refreshToken, running RefreshToken.findOne() : " + err);
			response.status = 500;
			response.message = "RefreshToken.findOne() not available";
			throw response;
		});

	//generate refresh token
	var refreshTokenStr;
	if (existingRefreshTokenObj == null) {
		try {
			refreshTokenStr = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			logger.error("Error while signing refreshToken, running jwt.sign() : " + err);
			response.status = 500;
			response.message = "jwt.sign() not available";
			throw response;
		}

		//save refresh token to db
		var refreshTokenObj = new RefreshToken();
		refreshTokenObj.tokenStr = refreshTokenStr;
		refreshTokenObj.issueTime = new Date();
		refreshTokenObj.userId = user.id;
		await refreshTokenObj.save()
			.then(() => {
				logger.info("Sucessfully saved refreshToken for user : " + refreshTokenObj.userId);
			})
			.catch(err => {
				logger.error("Error while saving refreshToken, running RefreshToken.save() : " + err);
				response.status = 500;
				response.message = "jwt.sign() not available";
				throw response;
			});
	}else{
		refreshTokenStr = existingRefreshTokenObj.tokenStr;
	}
		
	return { accessToken : accessTokenStr, refreshToken : refreshTokenStr };

}

/**
 * By : Ken Lai
 * Date : Mar 2, 2020
 * 
 * Get new access token from old refresh token
 */
async function getNewAccessToken(input){

	var response = new Object;

	//validate refresh token
	if (input.refreshToken == null || input.refreshToken.length < 1) {
		response.status = 400;
		response.message = "refreshToken is mandatory";
		throw response;
	}

	//look for issued refresh token in db
	var refreshTokenObj;
	await RefreshToken.findOne({ "tokenStr": input.refreshToken })
		.exec()
		.then(result => {
			refreshTokenObj = result;
		})
		.catch(err => {
			logger.error("Error while running RefreshToken.findOne() : " + err);
			response.status = 500;
			response.message = "RefreshToken.findOned() not available";
			throw response;
		});

	if(refreshTokenObj==null){
		response.status = 403;
		response.message = "Invalid refreshToken";
		throw response;
	}

	//get user from refresh token
	var user;
	jwt.verify(refreshTokenObj.tokenStr, process.env.REFRESH_TOKEN_SECRET, (err, unhashed) => {
		if (err) {
			logger.error("error while running jwt.verify() : " + err);
			response.status = 403;
			response.message = "Invalid refreshToken";
			throw response;
		}
		
		user = unhashed;
	});
	
	//generate access token
	var accessTokenStr;
	try {
		accessTokenStr = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: PERSON_ACCESS_TOKEN_EXPIRES })
	} catch (err) {
		logger.error("Error while running jwt.sign() : " + err);
		response.status = 500;
		response.message = "jwt.sign() not available";
		throw response;
	}
	
	return {"accessToken" : accessTokenStr}
}

async function logout(input){
	
	var response = new Object();

	//validate refresh token
	if(input.userId==null){
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	var targetRefreshToken;
	await RefreshToken.findOne({ "userId": input.userId })
		.then(result => {
			targetRefreshToken = result;
		})
		.catch(err => {
			logger.error("Error while running RefreshToken.findOne() : " + err);
			response.status = 500;
			response.message = "RefreshToken.findOne() not available";
			throw response;
		});
	

	if(targetRefreshToken==null){
		response.status = 401;
		response.message = "Invalid userId";
		throw response;
	}

	//async delete refresh token
	await RefreshToken.findByIdAndDelete(targetRefreshToken._id)
		.exec()
		.then(() => {
			logger.info("Successfully deleted refreshToken for credentials : " + targetRefreshToken.userId);
		})
		.catch(err => {
			response.status = 500;
			response.message = "refreshTokenModel.deleteToken() not available";
			throw response;
		});

	return;
}

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	getNewAccessToken,
	logout
}

function resetPassword(input) {

	var response = new Object();

	//validate userId
	if (input.userId == null || input.userId.length == 0) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	//validate oldPassword
	if (input.oldPassword == null || input.oldPassword.length == 0) {
		response.status = 400;
		response.message = "Old Password is mandatory";
		throw response;
	}

	//validate newPassword
	if (input.newPassword == null || input.newPassword.length == 0) {
		response.status = 400;
		response.message = "New Password is mandatory";
		throw response;
	}

	//validate newPassword
	if (input.confirmNewPassword == null || input.confirmNewPassword.length == 0) {
		response.status = 400;
		response.message = "Confirm New Password is mandatory";
		throw response;
	}

	if (input.newPassword != input.confirmNewPassword) {
		response.status = 400;
		response.message = "Confirm New Password error";
		throw response;
	}


	//TODO
}