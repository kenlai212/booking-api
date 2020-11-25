const moment = require("moment");
const Joi = require("joi");
const uuid = require("uuid");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const authenticationHelper = require("./authentication_internal.helper");
const activationEmailHelper = require("./activationEmail.helper");
const userObjectMapper = require("./userObjectMapper.helper");
const userHistoryService = require("./userHistory.service");

const ACTIVE_STATUS = "ACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

async function socialRegister(input) {
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("FACEBOOK", "GOOGLE")
			.required(),
		providerUserId: Joi
			.string()
			.required(),
		emailAddress: Joi
			.string()
			.required(),
		name: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	try {
		let existingSocialUser = await User.findOne(
			{
				provider: input.provider,
				providerUserId: input.providerUserId
			});
		
		if (existingSocialUser != null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already exist" };
		}
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	var newUser = new User();
	newUser.provider = input.provider;
	newUser.providerUserId = input.providerUserId;
	newUser.emailAddress = input.emailAddress;
	newUser.name = input.name;

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();

	//save newUser record to db
	try {
		newUser = await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init userHistory
	const historyItem = {
		userId: newUser._id.toString(),
		transactionDescription: "New User registered"
	}

	try {
		await userHistoryService.initUserHistory(historyItem);
	} catch (err) {
		logger.error("userHistoryService.initUserHistory() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//map to output obj
	let outputObj = userObjectMapper.toOutputObj(newUser);
	outputObj.activationKey = newUser.activationKey;

	return outputObj;
}

async function register(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		password: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		emailAddress: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		name: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		sendActivationEmail: Joi
			.boolean()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check loginId availibility
	let isAvailable;
	try {
		isAvailable = await authenticationHelper.checkLoginIdAvailability(input.loginId);
	} catch (err) {
		logger.error("authenticationHelper.checkLoginAvailability() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (isAvailable == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "LoginId already taken" };
	}

	//save new user
	var newUser = new User();
	newUser.provider = "GOGOWAKE"
	newUser.emailAddress = input.emailAddress;
	newUser.name = input.name;

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();

	try {
		newUser = await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save userHistory
	const histroyItem = {
		userId: newUser._id.toString(),
		transactionDescription: "New Social User registered"
	}

	try {
		await userHistoryService.initUserHistory(histroyItem);
	} catch (err) {
		logger.error("userHistoryService.initUserHistory() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save credential
	try {
		await authenticationHelper.addNewCredentials(input.loginId, input.password, newUser.id);
	} catch (err) {
		logger.error("Rolling back newUser.save()", err);
		//TODO roll back newUser.save();

		logger.error("authenticationHelper.addNewCredentials error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if input.sendActivationEmail is not ture, then resolve immediately
	if (input.sendActivationEmail == true) {
		try {
			let sentActivationEmailResult = await activationEmailHelper.sendActivationEmail(newUser.activationKey, newUser.emailAddress);

			//save userHistroy to reflect activation email sent
			historyItem.transactionDescription = "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId;
			try {
				await userHistoryService.addHistoryItem(historyItem);
			} catch (err) {
				logger.error("userHistoryService.addHistoryItem() error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
		} catch (err) {
			logger.error("authenticationHelper.addNewCredentials error : ", err);

			//save userHistroy to reflect activation email failed
			historyItem.transactionDescription = "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId;
			try {
				await userHistoryService.addHistoryItem(historyItem);
			} catch (err) {
				logger.error("userHistoryService.addHistoryItem() error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}

			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
	}

	//map to output obj
	let outputObj = userObjectMapper.toOutputObj(newUser);
	outputObj.activationKey = newUser.activationKey;

	return outputObj;
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
		userId: targetUser._id.toString(),
		transactionDescription: "User initiate forget password"
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
	activate,
	socialRegister,
	register
}