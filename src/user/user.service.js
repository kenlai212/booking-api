"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const userDomain = require("./user.domain");
const userHelper = require("./user.helper");

const USER_STATUS_CHANGED_QUEUE_NAME = "USER_STATUS_CHANGED";
const USER_GROUPS_CHANGED_QUEUE_NAME = "USER_GROUPS_CHANGED";
const SEND_MESSAGE_QUEUE_NAME = "SEND_MESSAGE";

async function activate(input) {
	const schema = Joi.object({
		activationKey: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let targetUser = userDomain.readUserByActivationKey(input.activationKey);

	//hold old status and activation key, incase we need to roll back
	const oldStatus = {...targetUser.status}
	const oldActivationKey = {...targetUser.activationKey};

	targetUser.status = "ACTIVE";
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = undefined;

	targetUser = await userDomain.updateUser(targetUser);

	const msg = {
		userId: targetUser._id,
		userStatus: targetUser.status
	}

	await utility.publishEvent(msg, USER_STATUS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back user activation");
		
		targetUser.status = oldStatus;
		targetUser.activationKey = oldActivationKey;
		await userDomain.updateUser(targetUser);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${USER_STATUS_CHANGED_QUEUE_NAME} queue`, 
		eventMsg: msg
	};
}

async function updateLastLogin(input) {
	const schema = Joi.object({
		userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = userDomain.readUser(input.userId);

	user.lastLoginTime = new Date();

	return await userDomain.updateUser(user); 
}

async function adminActivate(input){
	const schema = Joi.object({
		userId: Joi.string().required(),
	});
	utility.validateInput(schema, input);

	let user = await userDomain.readUser(input.userId);

	user.status = "ACTIVE";
	user.lastUpdateTime = new Date();

	return await userDomain.updateUser(user); 
}

async function deactivate(input){
	const schema = Joi.object({
		userId: Joi.string().required(),
	});
	utility.validateInput(schema, input);

	let user = userDomain.readUser(input.userId);

	oldStatus = {...user.status};

	user.status = "INACTIVE";
	user.lastUpdateTime = new Date();

	user = await userDomain.updateUser(user);
	
	const msg = {
		userId: targetUser._id,
		userStatus: targetUser.status
	}

	await utility.publishEvent(msg, USER_STATUS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back user deactivation");
		
		targetUser.status = oldStatus;
		await userDomain.updateUser(targetUser);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${USER_STATUS_CHANGED_QUEUE_NAME} queue`, 
		eventMsg: msg
	};
}

async function unassignGroup(input) {
	const schema = Joi.object({
		userId: Joi.string().required(),
		groupId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	userHelper.validateGroupId(input.groupId);
	
	let user = userDomain.readUser(input.userId);
	
	const oldGroups = {...user.groups}

	user.groups.forEach(function (groupId, index, object) {
		if (groupId === input.groupId) {
			object.splice(index, 1);
		}
	});

	user = await userDomain.updateUser(user);
	
	const msg = {
		userId: user._id,
		userStatus: user.groups
	}

	await utility.publishEvent(msg, USER_GROUPS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back unassignGroup");
		
		user.groups = oldGroups;
		await userDomain.updateUser(user);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${USER_GROUPS_CHANGED_QUEUE_NAME} queue`, 
		eventMsg: msg
	};
}

async function assignGroup(input) {
	const schema = Joi.object({
		userId: Joi.string().required(),
		groupId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	userHelper.validateGroupId(input.userId);

	let user = userDomain.readUser(input.userId);
	
	const oldGroups = {...user.groups};

	//see if target group already assigned to target user
	user.groups.forEach(group => {
		if (group == input.groupId) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "Group alredy assigned to this user" };
		}
	})

	user.groups.push(input.groupId);

	user = await userDomain.updateUser(user);

	const msg = {
		userId: user._id,
		userStatus: user.groups
	}

	await utility.publishEvent(msg, USER_GROUPS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back assignGroup");
		
		user.groups = oldGroups;
		await userDomain.updateUser(user);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${USER_GROUPS_CHANGED_QUEUE_NAME} queue`, 
		eventMsg: msg
	};
}

async function searchGroups(input, user) {
	return userHelper.validGroupIds;
}

async function deleteUser(input) {
	const schema = Joi.object({
		userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await userDomain.deleteUser(input.userId);

	return {status: "SUCCESS"};
}

async function resendActivationEmail(input, user) {
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let targetUser = userDomain.readUser(input.userId);

	const oldActivationKey = {...targetUser.activationKey};
	const oldStatus = {...targetUser.status}

	targetUser.activationKey = uuid.v4();
	targetUser.lastUpdateTime = new Date();
	targetUser.status = "AWAITING_ACTIVATION";

	targetUser = await userDomain.updateUser(targetUser);

	//assemble activation message
	const activationURL = config.get("user.activation.activationURL") + "/" + activationKey;
    const body = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
	const msg = {
		partyId: targetUser.partyId,
		title: "Activate your account",
		body: body
	}

	await utility.publishEvent(msg, SEND_MESSAGE_QUEUE_NAME, targetUser, async () => {
		logger.error("rolling back send activation");
		
		targetUser.status = oldStatus;
		targetUser.activationKey = oldActivationKey;
		await userDomain.updateUser(targetUser);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${SEND_MESSAGE_QUEUE_NAME} queue`, 
		eventMsg: msg
	};
}

module.exports = {
	activate,
	updateLastLogin,
	adminActivate,
	deactivate,
	assignGroup,
	unassignGroup,
	deleteUser,
	resendActivationEmail,
	searchGroups
}