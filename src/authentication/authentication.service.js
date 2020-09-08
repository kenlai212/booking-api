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

const USER_PATH = "/user";

async function checkLoginIdAvailability(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
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
			.required(),
		providerUserId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	var url = process.env.AUTHENTICATION_DOMAIN + USER_PATH + "?provider=" + input.provider + "&providerUserId=" + input.providerUserId;

		//////////////////////////////////TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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

	//hash input.password
	let hashedPassword;
	try {
		hashedPassword = await bcrypt.compare(input.password, credentials.hashedPassword);
	} catch (err) {
		throw { name: customerError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//see if hashed password matches with password in credentials record
	if (hashedPassword != credentials.password) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
	}

	//find user
	let user;
	try {
		user = userHelper.getUser(credentials.userId);
	} catch (err) {
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
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