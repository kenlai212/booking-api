"use strict";
const uuid = require("uuid");
const Joi = require("joi");
const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");

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
		targetUserId: targetUser._id.toString(),
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

async function activate(input) {
	//validate input data
	const schema = Joi.object({
		activationKey: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find target user
	let targetUser;
	try {
		targetUser = await User.findOne({
			"activationKey": input.activationKey
		});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid activationKey" };
	}

	//set user status to ACTIVE
	//set new lastUpdateTime
	//delete activationKey
	targetUser.status = ACTIVE_STATUS;
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = undefined;

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "User initiate forget password",
		triggerByUser: targetUser
	}

	try {
		await userHistoryService.addHistoryItem(historyItem);
	} catch (err) {
		logger.error("userHistoryService.addHistoryItem Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return userObjectMapper.toOutputObj(targetUser);
}

async function updateLastLogin(input, user) {
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
	if (targetUser.groups.includes(USER_ADMIN_GROUP) == true || targetUser._id == input.userId) {
		authorize = true;
	}

	if (authorize == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//update lastLoginTime
	targetUser.lastLoginTime = moment().toDate();

	//save to db
	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("targetUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "Updated user contact",
		triggerByUser: user
	}

	try {
		await userHistoryService.addHistoryItem(historyItem);
	} catch (err) {
		logger.error("userHistoryService.addHistoryItem Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return userObjectMapper.toOutputObj(targetUser); 
}

module.exports = {
	findUser,
	findSocialUser,
	forgetPassword,
	activate,
	updateLastLogin
}