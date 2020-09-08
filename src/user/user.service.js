"use strict";
const uuid = require("uuid");
const Joi = require("joi");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const authenticationHelper = require("./authentication_internal.helper");
const activationEmailService = require("./activationEmail.service");
const userObjectMapper = require("./userObjectMapper.helper");

const ACTIVE_STATUS = "ACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

async function socialRegister(input){
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("FACEBOOK", "GOOGLE", "GOGOWAKE")
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
		let existingSocialUser = User.findOne(
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
	newUser.providerId = input.providerId;
	newUser.providerUserId = input.providerUserId;
	newUser.emailAddress = input.emailAddress;
	newUser.name = input.name;

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = common.getNowUTCTimeStamp();
	newUser.activationKey = uuid.v4();
	newUser.history = [
		{
			transactionTime: common.getNowUTCTimeStamp(),
			transactionDescription: "New User registered"
		}
	];

	//save newUser record to db
	try {
		return await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function register(input){
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.required(),
		password: Joi
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
		throw{ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}
	
	//check loginId availibility
	try {
		let isAvailable = await authenticationHelper.checkLoginIdAvailability(input.loginId);
		
		if (isAvailable == false) {
			throw{ name: customError.BAD_REQUEST_ERROR, message: "LoginId already taken" };
		}
	} catch (err) {
		logger.error("authenticationHelper.checkLoginAvailability() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save new user
	var newUser = new User();
	newUser.emailAddress = input.emailAddress;
	newUser.name = input.name;

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();
	newUser.history = [
		{
			transactionTime: moment().toDate(),
			transactionDescription: "New User registered"
		}
	];

	try {
		newUser = await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
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
			let sentActivationEmailResult = await activationEmailService.sendActivationEmail(newUser.activationKey, newUser.emailAddress);

			//set histroy to reflect activation email sent
			const historyItem = {
				transactionTime: common.getNowUTCTimeStamp(),
				transactionDescription: "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId
			}
			newUser.history.push(historyItem);

			//update newUser record with history
			try {
				newUser.save();
			} catch (err) {
				logger.error("update newUser history error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
		} catch (err) {
			logger.error("authenticationHelper.addNewCredentials error : ", err);

			//set history to reflect activation email failed
			const historyItem = {
				transactionTime: common.getNowUTCTimeStamp(),
				transactionDescription: "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId
			}
			newUser.history.push(historyItem);

			//update newUser record with history
			try {
				newUser.save();
			} catch (err) {
				logger.error("update newUser history error : ", err);
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

async function activateUser(input, user){
	//TODO validate user either admin or self

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
	targetUser.activationKey = null;

	const histroyItem = {
		transactionTime: common.getNowUTCTimeStamp(),
		transactionDescription: "User activated"
	}
	targetUser.history.push(histroyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	} 
}

async function forgetPassword(input){
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

	//find targetUser
	let user;
	try {
		user = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid userId" };
	}

	//set resetPasswordKey
	user.resetPassordKey = uuid.v4();

	try {
		return await user.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function updateEmailAddress(input, user) {
	//TODO validate user either admin or self

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		emailAddress: Joi
			.string()
			.required()
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

	//update emailAddress in user record
	targetUser.emailAddress = input.emailAddress;

	//set history
	const historyItem = {
		transactionTime: moment().toDate(),
		transactionDescription: "Updated email address"
	}
	targetUser.history.push(historyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function updateTelephoneNumber(input, user) {
	//TODO validate user either admin or self

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.validate("852", "853", "86")
			.required(),
		telephoneNumber: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
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

	//update telephoneCountry and telephoneNumber and  in user record
	targetUser.telephoneCountryCode = input.telephoneCountryCode;
	targetUser.telephoneNumber = input.telephoneNumber;

	//set history
	const historyItem = {
		transactionTime: moment().toDate(),
		transactionDescription: "Updated telephone number"
	}
	targetUser.history.push(historyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

module.exports = {
	activateUser,
	socialRegister,
	register,
	forgetPassword,
	updateEmailAddress,
	updateTelephoneNumber
}