"use strict";
const uuid = require("uuid");
const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");
const userHistoryService = require("./userHistory.service");
const profileHelper = require("../common/profile/profile.helper");

const USER_ADMIN_GROUP = "USER_ADMIN";

const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

async function createNewUser(input){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.required(),
		provider: Joi
			.string()
			.valid("GOOGLE","FACEBOOK", null),
		providerUserId: Joi
			.string()
			.allow(null),
		personalInfo: Joi
			.object()
			.required(),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null)	
	});
	utility.validateInput(schema, input);

	//save new user
	let newUser = new User();
	newUser.partyId = input.partyId;

	//validate and set personalInfo
	profileHelper.validatePersonalInfoInput(input.personalInfo);
	newUser = profileHelper.setPersonalInfo(input.personalInfo, newUser);

	//validate and set contact
	if(input.contact!= null){
		profileHelper.validateContactInput(input.contact);
		newUser = profileHelper.setContact(input.contact, newUser);
	}

	//validate and set picture
	if(input.picture != null){
		profileHelper.validatePictureInput(input.picture);
		newUser = profileHelper.setPicture(input.picture, newUser);
	}

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();

	if(input.providerUserId != null && input.providerUserId.length > 0){
		newUser.provider = input.provider;
		newUser.providerUserId = input.providerUserId;
	}

	try {
		newUser = await newUser.save();
	} catch (error) {
		logger.error("newUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init userHistory
	const historyItem = {
		userId: newUser._id.toString(),
		transactionDescription: "New User registered"
	}

	userHistoryService.initUserHistory(historyItem)
	.catch(() => {
		logger.error(`User record(${newUser._id.toString()}) created, but initUserHistory failed ${JSON.stringify(historyItem)}.`);
	});

	//map to output obj
	let userOutput = userObjectMapper.toOutputObj(newUser);
	//add activation key to userOutput
	userOutput.activationKey = newUser.activationKey;

	return userOutput;
}

async function findUser(input) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

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
	utility.validateInput(schema, input);

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

async function activate(input) {
	//validate input data
	const schema = Joi.object({
		activationKey: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

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
		transactionDescription: "User activation",
		triggerByUser: targetUser
	}

	userHistoryService.addHistoryItem(historyItem)
	.catch(() => {
		logger.error(`User(${targetUser._id.toString()}) activated, but failed to addHistoryItem ${JSON.stringify(historyItem)}`);
	});

	return userObjectMapper.toOutputObj(targetUser);
}

async function updateLastLogin(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

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

	return userObjectMapper.toOutputObj(targetUser); 
}

module.exports = {
	createNewUser,
	findUser,
	findSocialUser,
	activate,
	updateLastLogin
}