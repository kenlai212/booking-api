"use strict";
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Credentials = require("./credentials.model").Credentials;
const userHelper = require("./user_internal.helper");

const ACCESS_TOKEN_EXPIRES = "1h";
const PASSWORD_HASH_STRENGTH = 10;

async function checkLoginIdAvailability(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.min(1)
			.max(255)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check loginId availability
	try {
		const credentials = await Credentials.findOne({ "loginId": input.loginId });

		if (credentials == null) {
			return { "isAvailable": true };
		} else {
			return { "isAvailable": false };
		}
	} catch (err) {
		logger.error("Credentials.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function addNewCredentials(input) {
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
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	try {
		const existingCredentials = await Credentials.findOne({ "loginId": input.loginId });
		//check loginId availability
		if (existingCredentials != null) {
			throw { name: "loginIdNotAvailableError", message: "loginId not available" };
		}
	} catch (err) {
		logger.error("Credentials.findOne error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//hash password
	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(input.password, PASSWORD_HASH_STRENGTH);
	} catch (err) {
		logger.error("bcrypt.hash error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	} 

	var newCredentials = new Credentials();
	newCredentials.hashedPassword = hashedPassword;
	newCredentials.loginId = input.loginId;
	newCredentials.userId = input.userId;
	newCredentials.createdTime = new Date();

	try {
		newCredentials = await newCredentials.save();
	} catch (err) {
		logger.error("newCredentials.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return newCredentials;
}

async function socialLogin(input) {
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.min(1)
			.required(),
		providerUserId: Joi
			.string()
			.min(1)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find user
	let user;
	try {
		user = await userHelper.getSocialUser(input.provider, input.providerUserId);
	} catch (err) {
		//if no user found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//sign user into token
	try {
		return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	} catch (err) {
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
}

async function login(input){
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
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find credentials
	let credentials;
	try {
		credentials = await Credentials.findOne({ "loginId": input.loginId });
	} catch (err) {
		logger.error("newCredentials.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (credentials == null) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
	}
	
	//compare input.password with credentials record
	try {
		if (await bcrypt.compare(input.password, credentials.hashedPassword) == false) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		};
	} catch (err) {
		throw { name: customerError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//find user
	let user;
	try {
		user = await userHelper.getUser(credentials.userId);
	} catch (err) {
		//if no user found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//check user status
	if (user.status != "ACTIVE") {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Inactive User" };
	}

	//sign user into token
	try {
		return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	} catch (err) {
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	socialLogin
}