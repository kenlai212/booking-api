const Joi = require("joi");
const uuid = require("uuid");

const utility = require("../common/utility");
const {logger, customError} = utility;

const User = require("./user.model").User;
const userObjectMapper = require("./userObjectMapper.helper");

async function adminActivate(input, user){
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
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

	targetUser.status = "ACTIVE";
	targetUser.lastUpdateTime = new Date();

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetUser;
}

async function deactivate(input, user){
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
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

	targetUser.status = "INACTIVE";
	targetUser.lastUpdateTime = new Date();

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save User Error" };
	}

	return targetUser;
}

async function unassignGroup(input, user) {
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
				"CREW_USER",
				"PARTY_ADMIN")
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

	targetUser.groups.forEach(function (groupId, index, object) {
		if (groupId == input.groupId) {
			object.splice(index, 1);
		}
	});

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save User Error" };
	}

	return targetUser;
}

async function assignGroup(input, user) {
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
				"CREW_USER",
				"PARTY_ADMIN")
			.required()
		//TODO add more valid groups
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

	return targetUser;
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
		"CREW_USER",
		"PARTY_ADMIN"]
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
	const schema = Joi.object({
		userId: Joi
			.string()
			.min(1)
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

	try {
		await User.findByIdAndDelete(targetUser._id.toString());
	} catch (err) {
		logger.error("User.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetUser;
}

async function resendActivationEmail(input, user) {
	const schema = Joi.object({
		userId: Joi
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

	const oldActivationKey = {...targetUser.activationKey};
	const oldStatus = {...targetUser.status}

	targetUser.activationKey = uuid.v4();
	targetUser.lastUpdateTime = new Date();
	targetUser.status = "AWAITING_ACTIVATION";

	try {
		targetUser = await targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}


	const eventQueueName = "sendMessage";

	//assemble activation message
	const activationURL = config.get("user.activation.activationURL") + "/" + activationKey;
    const body = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
	const msg = {
		partyId: targetUser.partyId,
		title: "Activate your account",
		body: body
	}

	await utility.publishEvent(msg, eventQueueName, targetUser, async () => {
		logger.error("rolling back send activation");
		
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
		sendMessageEventMsg: msg
	};
}

module.exports = {
	adminActivate,
	deactivate,
	assignGroup,
	unassignGroup,
	searchUsers,
	deleteUser,
	resendActivationEmail,
	searchGroups
}