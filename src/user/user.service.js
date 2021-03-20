"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {User} = require("./user.model");

async function activate(input) {
	const schema = Joi.object({
		activationKey: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let targetUser;
	try {
		targetUser = await User.findOne({
			"activationKey": input.activationKey
		});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!targetUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid activationKey" };

	//hold old status and activation key, incase we need to roll back
	const oldStatus = {...targetUser.status}
	const oldActivationKey = {...targetUser.activationKey};

	targetUser.status = "ACTIVE";
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = undefined;

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	const eventQueueName = "userActivated";
	const msg = {
		userId: targetUser._id
	}

	await utility.publishEvent(msg, eventQueueName, targetUser, async () => {
		logger.error("rolling back user activation");
		
		try{
			targetUser.status = oldStatus;
			targetUser.activationKey = oldActivationKey;

			await targetUser.save();
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Rollback save user Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		newUserActivatedEventMsg: msg
	};
}

async function updateLastLogin(input, user) {
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let targetUser;
	try {
		targetUser = await User.findById(userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}
	
	if(!targetUser)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid userId" };

	targetUser.lastLoginTime = new Date();

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("targetUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetUser; 
}

module.exports = {
	activate,
	updateLastLogin
}