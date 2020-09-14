"use strict";
const uuid = require("uuid");
const Joi = require("joi");
const moment = require("moment");
const mongoose = require("mongoose");
const config = require("config");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");
const notificationHelper = require("./notification_internal.helper");

/**
 * By : Ken Lai
 * Date : Mar 15, 2020
 * 
 * find user by id or by accessToken, or provider with providerUserId
 */
async function findUser(input) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate userId
	if (mongoose.Types.ObjectId.isValid(input.userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	let user;
	try {
		user = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.RESOURCE_NOT_FOUND, message: "No user found" };
	}

	return userObjectMapper.toOutputObj(user);
}

async function findSocialUser(input) {
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("GOOGLE", "FACEBOOK")
			.required(),
		providerUserId: Joi
			.string()
			.min(1)
			.max(255)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find user with provider and providerUserId
	let user;
	try {
		user = await User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.RESOURCE_NOT_FOUND, message: "No user found" };
	}

	return userObjectMapper.toOutputObj(user);
}

async function forgetPassword(input){
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate userId
	if (mongoose.Types.ObjectId.isValid(input.userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//find targetUser
	let user;
	try {
		user = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid userId" };
	}

	//set resetPasswordKey
	user.resetPassordKey = uuid.v4();
	user.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: "Forget password email sent to user"
	});

	//set reset password email
	const resetPasswordURL = config.get("user.forgetPassword.resetPasswordURL") + user.resetPassordKey;
	const emailBody = `Follow this <a href="${resetPasswordURL}">link</a> to reset your password`;
	try {
		notificationHelper.sendEmail(config.get("user.forgetPassword.systemSenderEmailAddress"), user.emailAddress, emailBody, "Reset Password");
	} catch (err) {
		logger.error("notificationHelper.sendEmail Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save user
	try {
		return await user.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function updateEmailAddress(input, user) {
	//TODO validate user either admin or self

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		emailAddress: Joi
			.string()
			.required()
		//TODO validate email address format
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid userId" };
	}

	//update emailAddress in user record
	targetUser.emailAddress = input.emailAddress;

	//set history
	const historyItem = {
		transactionTime: moment().toDate(),
		transactionDescription: "Updated email address"
	}
	targetUser.history.push(historyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function updateTelephoneNumber(input, user) {
	//TODO validate user either admin or self

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.validate("852", "853", "86")
			.required(),
		telephoneNumber: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
	}

	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid userId" };
	}

	//update telephoneCountry and telephoneNumber and  in user record
	targetUser.telephoneCountryCode = input.telephoneCountryCode;
	targetUser.telephoneNumber = input.telephoneNumber;

	//set history
	const historyItem = {
		transactionTime: moment().toDate(),
		transactionDescription: "Updated telephone number"
	}
	targetUser.history.push(historyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

module.exports = {
	findUser,
	findSocialUser,
	forgetPassword,
	updateEmailAddress,
	updateTelephoneNumber
}