const moment = require("moment");
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const UserHistory = require("./userHistory.model").UserHistory;

async function getUserHistory(input) {
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

	let userHistory;
	try {
		userHistory = await UserHistory.findOne({ userId: input.userId });
	} catch (err) {
		logger.error("UserHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (userHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid userId" };
	}

	return userHistory;
}

async function initUserHistory(input) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		transactionDescription: Joi
			.string()
			.required(),
		user: Joi
			.object()
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate userId
	if (mongoose.Types.ObjectId.isValid(input.userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	let existingUserHistory;
	try {
		existingUserHistory = await UserHistory.findOne({ userId: input.userId });
	} catch (err) {
		logger.error("UserHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingUserHistory != null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: `User History for userId : ${existingUserHistory._id} alerady exist` };
	}

	let userHistory = new UserHistory();
	userHistory.userId = input.userId;

	userHistory.history = [];

	const historyItem = new Object();
	historyItem.transactionTime = moment().utcOffset(8).toDate();
	historyItem.transactionDescription = input.transactionDescription;
	if (input.user != null) {
		historyItem.userId = input.user.id;
		historyItem.userName = input.user.userName;
	}

	userHistory.history.push(historyItem);

	try {
		userHistory = await userHistory.save();
	} catch (err) {
		logger.error("userHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return userHistory;
}

async function addHistoryItem(input) {
	//validate input data
	const schema = Joi.object({
		targetUserId: Joi
			.string()
			.required(),
		transactionDescription: Joi
			.string()
			.required(),
		triggerByUser: Joi
			.object()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate targetUserId
	if (mongoose.Types.ObjectId.isValid(input.targetUserId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid targetUserId : ${input.targetUserId}` };
	}

	//find userHistory
	let userHistory;
	try {
		userHistory = await UserHistory.findOne({ userId: input.targetUserId });
	} catch (err) {
		logger.error("UserHistory.findOne Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (userHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Invalid targetUserId : ${input.userId}` };
	}

	//set new history item
	const historyItem = new Object();
	historyItem.transactionTime = moment().utcOffset(8).toDate();
	historyItem.transactionDescription = input.transactionDescription;
	if (input.triggerByUser != null) {
		historyItem.userId = input.triggerByUser.id;
		historyItem.userName = input.triggerByUser.userName;
	}

	userHistory.history.push(historyItem);

	//save booking history
	try {
		userHistory = await userHistory.save();
	} catch (err) {
		logger.error("userHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return userHistory;
}

async function deleteUserHistory(input) {
	//validate input data
	const schema = Joi.object({
		targetUserId: Joi
			.string()
			.required(),
		triggerByUser: Joi
			.object()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate targetUserId
	if (mongoose.Types.ObjectId.isValid(input.targetUserId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid targetUserId : ${input.targetUserId}` };
	}

	//find userHistory
	let userHistory;
	try {
		userHistory = await UserHistory.findOne({ userId: input.targetUserId });
	} catch (err) {
		logger.error("UserHistory.findOne Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (userHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Invalid targetUserId : ${input.userId}` };
	}

	//delete userHistory record
	try {
		await UserHistory.findByIdAndDelete(userHistory._id.toString());
	} catch (err) {
		logger.error("UserHistory.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return {"status":"SUCCESS"}
}

module.exports = {
	initUserHistory,
	addHistoryItem,
	getUserHistory,
	deleteUserHistory
}