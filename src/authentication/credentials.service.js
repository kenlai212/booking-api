"use strict";
const Joi = require("joi");
const bcrypt = require("bcryptjs");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Credentials = require("./credentials.model").Credentials;

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

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials
}