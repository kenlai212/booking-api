"use strict";
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Credentials = require("./credentials.model").Credentials;

const ACCESS_TOKEN_EXPIRES = "1h";
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

		//////////////////////////////////TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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

				return credentials;
			})
			.then(async credentials => {
				try{
					const matchedPassword = await bcrypt.compare(input.password, credentials.hashedPassword);

					if (passwordCompareResult == false) {
						reject({ name: customError.UNAUTHORIZED_ERROR, message: "Login failed" });
					}
				}catch(err){
					reject({name: customerError.INTERNAL_SERVER_ERROR, message: "Internal Server Error"});
				}
				
				return credentials;
			})
			.then(credentials => {
				const input = {
					userId: credentials.userId
				}

				return userService.findUser(input);
			})
			.then(user => {
				if (user == null) {
					reject({ name: customError.UNAUTHORIZED_ERROR, message: "Login failed" });
				}

				return user;
			})
			.then(user => {
				accessTokenStr = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });

				resolve(accessToken);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	socialLogin
}