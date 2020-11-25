"use strict";
const uuid = require("uuid");
const Joi = require("joi");
const mongoose = require("mongoose");
const config = require("config");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");
const notificationHelper = require("./notification_internal.helper");
const userHistoryService = require("./userHistory.service");

const USER_ADMIN_GROUP = "USER_ADMIN";

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

async function forgetPassword(input) {
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

	//set resetPasswordKey
	targetUser.resetPassordKey = uuid.v4();

	//set reset password email
	const resetPasswordURL = config.get("user.forgetPassword.resetPasswordURL") + targetUser.resetPassordKey;
	const emailBody = `Follow this <a href="${resetPasswordURL}">link</a> to reset your password`;
	try {
		notificationHelper.sendEmail(config.get("user.forgetPassword.systemSenderEmailAddress"), targetUser.emailAddress, emailBody, "Reset Password");
	} catch (err) {
		logger.error("notificationHelper.sendEmail Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save user
	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		userId: targetUser._id.toString(),
		transactionDescription: "User initiate forget password"
	}

	try {
		await userHistoryService.addHistoryItem(historyItem);
	} catch (err) {
		logger.error("userHistoryService.addHistoryItem Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return {"result": "SUCCESS"}
}

async function updateContactInfo(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		name: Joi
			.string()
			.min(1),
		emailAddress: Joi
			.string()
			.min(1),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86", null),
		telephoneNumber: Joi
			.string()
			.min(1)
		//TODO validate telephoneNmber
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
	
	//check for authorization. if USER_ADMIN or user.id is same as targetUser._id
	let authorize = false;
	if (user.groups.includes(USER_ADMIN_GROUP) == true) {
		authorize = true;
	}
	
	if (authorize == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}
	
	//update contact info
	let hasDelta = false;

	if (input.name != null) {
		targetUser.name = input.name;
		hasDelta = true;
	}

	if (input.telephoneNumber != null) {
		if (input.telephoneCountryCode == null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "telephoneCountryCode is mandatory" };
		}

		targetUser.telephoneCountryCode = input.telephoneCountryCode;
		targetUser.telephoneNumber = input.telephoneNumber;
		hasDelta = true;
	}
	
	if (input.emailAddress != null) {
		targetUser.emailAddress = input.emailAddress;
		hasDelta = true
	}

	if (hasDelta == true) {
		//save userHistory
		const historyItem = {
			userId: targetUser._id.toString(),
			transactionDescription: "Updated user contact",
			user: user
		}

		try {
			await userHistoryService.addHistoryItem(historyItem);
		} catch (err) {
			logger.error("userHistoryService.addHistoryItem Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}	

		return userObjectMapper.toOutputObj(targetUser);
	} else {
		throw { name: customError.BAD_REQUEST_ERROR, message: "No changes" };
	}
}

module.exports = {
	findUser,
	findSocialUser,
	forgetPassword,
	updateContactInfo,
}