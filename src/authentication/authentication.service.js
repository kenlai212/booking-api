"use strict";
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Credentials = require("./credentials.model").Credentials;

const PERSON_ACCESS_TOKEN_EXPIRES = "1h";
const SYSTEM_ACCESS_TOKEN_EXPIRES = "90d";
const PASSWORD_HASH_STRENGTH = 10;

const USER_PATH = "/user";

function checkLoginIdAvailability(input) {
	return new Promise((resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			loginId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//check loginId availability
		Credentials.findOne({ "loginId": input.loginId })
			.then(result => {
				if (result == null) {
					resolve({ "isAvailable": true });
				} else {
					resolve({ "isAvailable": false });
				}
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function addNewCredentials(input) {
	return new Promise((resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			loginId: Joi
				.string()
				.required(),
			password: Joi
				.string()
				.required(),
			userId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		Credentials.findOne({ "loginId": input.loginId })
			.then(result => {
				//check loginId availability
				existingLoginId = result;

				if (existingLoginId != null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "loginId not available" });
				}

				return;
			})
			.then(() => {
				//hash password
				bcrypt.hash(input.password, PASSWORD_HASH_STRENGTH);
			})
			.then(hashedPassword => {
				var newCredentials = new Credentials();
				newCredentials.hashedPassword = hashedPassword;
				newCredentials.loginId = input.loginId;
				newCredentials.userId = input.userId;
				newCredentials.createdTime = new Date();

				return newCredentials.save();
			})
			.then(newCredentials => {
				resolve(newCredentials);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function socialLogin(input) {
	return new Promise((resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			provider: Joi
				.string()
				.required(),
			providerUserId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		var url = process.env.AUTHENTICATION_DOMAIN + USER_PATH + "?provider=" + input.provider + "&providerUserId=" + input.providerUserId;


	});
}

function login(input){
	return new Promise((resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			loginId: Joi
				.string()
				.required(),
			password: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//find credentials
		Credentials.findOne({ "loginId": input.loginId })
			.then(credentials => {
				if (credentials == null) {
					reject({ name: customError.UNAUTHORIZED_ERROR, message: "Login failed" });
				}

				//compare password
				return bcrypt.compare(input.password, credentials.hashedPassword);
			})
			.then(passwordCompareResult => {
				if (passwordCompareResult == false) {
					reject({ name: customError.UNAUTHORIZED_ERROR, message: "Login failed" });
				}

				url = process.env.AUTHENTICATION_DOMAIN + USER_PATH + "?userId=" + credentials.userId;
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});

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

		

		

		return { accessToken: accessTokenStr};

	});
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