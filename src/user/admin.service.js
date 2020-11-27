const Joi = require("joi");
const mongoose = require("mongoose");
const uuid = require("uuid");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");
const activationEmailHelper = require("./activationEmail.helper");
const userHistoryService = require("./userHistory.service");

const ACTIVE_STATUS = "ACTIVE";
const INACTIVE_STATUS = "INACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

async function editStatus(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		status: Joi
			.string()
			.valid(ACTIVE_STATUS, INACTIVE_STATUS)
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

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//update user status
	targetUser.status = input.status;
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = undefined;

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: `Admin changed user status : ${input.status}`,
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

async function unassignGroup(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.min(1)
			.required(),
		groupId: Joi
			.string()
			.valid(
				"BOOKING_ADMIN",
				"BOOKING_USER",
				"PRICING_USER",
				"OCCUPANCY_ADMIN",
				"NOTIFICATION_USER",
				"USER_ADMIN",
				"ASSET_ADMIN",
				"ASSET_USER",
				"CREW_ADMIN",
				"CREW_USER")
			.required()
		//TODO add more valid groups
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate userId
	if (mongoose.Types.ObjectId.isValid(input.userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//remove groupId from targetUSer.groups
	targetUser.groups.forEach(function (groupId, index, object) {
		if (groupId == input.groupId) {
			object.splice(index, 1);
		}
	});

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "Removed " + input.groupId + " from User",
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

async function assignGroup(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.min(1)
			.required(),
		groupId: Joi
			.string()
			.valid(
				"BOOKING_ADMIN",
				"BOOKING_USER",
				"PRICING_USER",
				"OCCUPANCY_ADMIN",
				"NOTIFICATION_USER",
				"USER_ADMIN",
				"ASSET_ADMIN",
				"ASSET_USER",
				"CREW_ADMIN",
				"CREW_USER")
			.required()
		//TODO add more valid groups
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate userId
	if (mongoose.Types.ObjectId.isValid(input.userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//see if target group already assigned to target user
	targetUser.groups.forEach(group => {
		if (group == input.groupId) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "Group alredy assigned to this user" };
		}
	})

	//add groupId to target.groups
	targetUser.groups.push(input.groupId);

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "Added " + input.groupId + " to User",
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

async function searchGroups(input, user) {
	return ["BOOKING_ADMIN",
		"BOOKING_USER",
		"PRICING_USER",
		"OCCUPANCY_ADMIN",
		"NOTIFICATION_USER",
		"USER_ADMIN",
		"ASSET_ADMIN",
		"ASSET_USER",
		"CREW_ADMIN",
		"CREW_USER"]
}

async function searchUsers(user) {
	//TODO!!!! add paginateion
	let users;
	try {
		users = await User.find();
	} catch (err) {
		logger.error("User.find() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	let outputObjs = [];
	users.forEach(user => {
		outputObjs.push(userObjectMapper.toOutputObj(user));
	});

	return {
		count: outputObjs.length,
		users: outputObjs
	}
}

async function deleteUser(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.min(1)
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

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	try {
		await User.deleteOne(targetUser._id);
	} catch (err) {
		logger.error("User.deleteOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return {"status": "SUCCESS"}
}

async function resendActivationEmail(input, user) {
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

	//get user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	}
	catch (err) {
		logger.error("User.findById error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set activation key and set AWAITING_ACTIVATION status
	targetUser.activationKey = uuid.v4();
	targetUser.lastUpdateTime = new Date();
	targetUser.status = AWAITING_ACTIVATION_STATUS;

	//send activation email
	let sendActivationEmailResult;
	try {
		sendActivationEmailResult = activationEmailHelper.sendActivationEmail(targetUser.activationKey, targetUser.emailAddress);
	} catch (err) {
		logger.error("this.sendActivationEmail error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "Sent activation email to user. MessageID : " + sendActivationEmailResult.messageId,
		triggerByUser: user
	}

	try {
		await userHistoryService.addHistoryItem(historyItem);
	} catch (err) {
		logger.error("userHistoryService.addHistoryItem Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return {"status": "SUCCESS"};
}

module.exports = {
	editStatus,
	assignGroup,
	unassignGroup,
	searchUsers,
	deleteUser,
	resendActivationEmail,
	searchGroups
}