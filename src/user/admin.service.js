const Joi = require("joi");
const mongoose = require("mongoose");
const uuid = require("uuid");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");
const userHistoryService = require("./userHistory.service");
const notificationHelper = require("./notification_internal.helper");

const ACTIVE_STATUS = "ACTIVE";
const INACTIVE_STATUS = "INACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

async function getTargetUser(userId){
	//validate userId
	if (mongoose.Types.ObjectId.isValid(userId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	return targetUser;
}

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
	utility.validateInput(schema, input);

	//get target user
	let targetUser = await getTargetUser(input.userId);

	//update user status
	targetUser.status = input.status;
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = undefined;

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("targetUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: `Admin changed user status : ${input.status}`,
		triggerByUser: user
	}

	userHistoryService.addHistoryItem(historyItem)
	.catch(`Edited user(${input.userId}) status to ${input.status}, but failed to addHistoryItem ${JSON.stringify(historyItem)}`);

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
	utility.validateInput(schema, input);

	//get target user
	let targetUser = await getTargetUser(input.userId);

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

	userHistoryService.addHistoryItem(historyItem)
	.catch(`Unassigned group ${input.groupId} from user(${input.userId}), but failed to addHistoryItem ${JSON.stringify(historyItem)}`);

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
	utility.validateInput(schema, input);

	//get target user
	let targetUser = await getTargetUser(input.userId);

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

	userHistoryService.addHistoryItem(historyItem)
	.catch(`Assigned group ${input.groupId} from user(${input.userId}), but failed to addHistoryItem ${JSON.stringify(historyItem)}`);

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
	utility.validateInput(schema, input);

	//get target user
	let targetUser = await getTargetUser(input.userId);

	//delete user record
	try {
		await User.findByIdAndDelete(targetUser._id.toString());
	} catch (err) {
		logger.error("User.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//delete userHistory record
	const deleteUserHistoryInput = {
		"targetUserId": targetUser._id.toString(),
		"triggerByUser": user
	}

	userHistoryService.deleteUserHistory(deleteUserHistoryInput)
	.catch(() => {
		logger.error(`Deleted user ${input.userId}, but failed to deleteUserHistory ${JSON.stringify(deleteUserHistoryInput)}`);
	});
	
	return {"status": "SUCCESS"}
}

async function resendActivationEmail(input, user) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//get user
	let targetUser = await getTargetUser(input.userId);

	//set activation key and set AWAITING_ACTIVATION status
	targetUser.activationKey = uuid.v4();
	targetUser.lastUpdateTime = new Date();
	targetUser.status = AWAITING_ACTIVATION_STATUS;

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//assemble and send activation email
	const activationURL = config.get("user.activation.activationURL") + "/" + activationKey;
    const bodyHTML = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
	const sendEmailInput = {
        sender: config.get("user.activation.systemSenderEmailAddress"),
        recipient: recipient,
        emailBody: bodyHTML,
        subject: "GoGoWake Account Activation"
    }

	notificationHelper.sendEmail(sendEmailInput, user)
	.catch(() => {
		logger.error(`Activation Key resetted for user(${input.userId}), but failed to sendEmail ${JSON.stringify(sendEmailInput)}`);
	});

	//save userHistory
	const historyItem = {
		targetUserId: targetUser._id.toString(),
		transactionDescription: "Sent activation email to user. MessageID : " + sendActivationEmailResult.messageId,
		triggerByUser: user
	}

	userHistoryService.addHistoryItem(historyItem)
	.catch(() => {
		logger.error(`Resended activation email to user(${input.userId}), but failed to addHistoryItem ${historyItem}`);	
	});

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