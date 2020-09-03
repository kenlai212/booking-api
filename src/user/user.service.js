"use strict";
const uuid = require("uuid");
const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const authenticationService = require("../authentication/authentication.service");
const activationEmailService = require("./activationEmail.service");

const ACTIVE_STATUS = "ACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

const LOGIN_ID_PATH = "/loginId";
const CREDENTIALS_PATH = "/credentials";

function socialRegister(input){
	return new Promise(async (resolve, reject) => {
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
			telephoneCountryCode: Joi
				.string()
				.valid("852", "853", "86")
				.required(),
			telephoneNumber: Joi
				.string()
				.required(),
			name: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		var newUser = new User();
		newUser.providerUserId = input.providerUserId;

		User.findOne(
			{
				provider: input.provider,
				providerUserId: input.providerUserId
			})
			.then(existingSocialUser => {
				if (existingSocialUser != null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "providerUserId already exist" });
				}
			})
			.catch(err => {
				logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Delete function not available" });
			});


		newUser.emailAddress = input.emailAddress;
		newUser.telephoneCountryCode = input.telephoneCountryCode;
		input.telephoneNumber = input.telephoneNumber.replace(/[^\w\s]/gi, '');
		newUser.telephoneNumber = input.telephoneNumber;
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
		newUser.save()
			.then(result => {
				newUser = result;
			})
			.catch(err => {
				logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Delete function not available" });
			});
	});
}

function register(input){
	return new Promise(async (resolve, reject) => {
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
				telephoneCountryCode: Joi
					.string()
					.valid("852", "853", "86")
					.required(),
				telephoneNumber: Joi
					.string()
					.required(),
				name: Joi
					.string()
					.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}
		
		var newUser = new User();

		authenticationService.checkLoginIdAvailability({loginId: loginId})
			.then(isAvailable => {
				if (isAvailable == false) {
					reject({ name: customError.INTERNAL_SERVER_ERROR, message: "LoginId already taken" });
				}

				return;
			})
			.then(() => {
				//save new user
				newUser.emailAddress = input.emailAddress;
				newUser.telephoneCountryCode = input.telephoneCountryCode;
				input.telephoneNumber = input.telephoneNumber.replace(/[^\w\s]/gi, '');
				newUser.telephoneNumber = input.telephoneNumber;
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

				return newUser.save();
			})
			.then(newUser => {
				//save credential
				authenticationService.addNewCredentials({
					loginId: input.loginId,
					password: input.password,
					userId: newUser.id
				});

				return;
			})
			.then(() => {
				//set sendActivationEmail input flag, default to false if not provided
				if (input.sendActivationEmail == null) {
					input.sendActivationEmail = false;
				}

				if(sendActivationEmail == false){
					var outputObj = userToOutputObj(newUser);
					outputObj.activationKey = newUser.activationKey;
		
					resolve(outputObj);
				}
				
				return activationEmailService.sendActivationEmail(newUser.activationKey, newUser.emailAddress);
			})
			.then(result=> {
				const historyItem = {
					transactionTime: common.getNowUTCTimeStamp(),
					transactionDescription: "Sent activation email to user. MessageID : " + result.messageId
				}
				newUser.history.push(historyItem);

				return newUser.save();
			})
			.then(newUser => {
				var outputObj = userToOutputObj(newUser);
				outputObj.activationKey = newUser.activationKey;
		
				resolve(outputObj);
			})
			.catch(err => {
				//TODO check for fail send email
				logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Delete function not available" });
			});
	});
}

function activateUser(input){
	
	var response = new Object();

	if (input.activationKey == null || input.activationKey.length < 1) {
		response.status = 400;
		response.message = "activationKey is mandatory";
		throw response;
	}

	//find user
	var user;
	await User.findOne({
		"activationKey": input.activationKey
	})
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("User.findOne() error : " + err);
			response.status = 500;
			response.message = "User.findOne() is not available";
			throw response;
		});

	//if no user found using the activation key,
	//it's a bad key
	if(user == null){
		response.status = 401;
		response.message = "Invalid activationKey";
		throw response;
	}

	//set user status to ACTIVE
	//set new lastUpdateTime
	//delete activationKey
	user.status = ACTIVE_STATUS;
	user.lastUpdateTime = new Date();
	user.activationKey = null;

	const histroyItem = {
		transactionTime: common.getNowUTCTimeStamp(),
		transactionDescription: "User activated"
	}
	user.history.push(histroyItem);

	await user.save()
		.then(result => {
			logger.info("Sucessfully updated ACTIVE status for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	return {"status" : ACTIVE_STATUS};
}

function forgetPassword(input){

	var response = new Object();

	//validate userId
	if(input.userId == null || input.userId.length == 0){
		response.status = 401;
		response.message = "userId is mandatory";
		throw response;
	}

	//find targetUser
	var user;
	User.findById(input.userId)
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("Error while running User.findById() : " + err);
			response.status = 500;
			response.message = "User.findById() is not available";
			throw response;
		});

	if(user == null){
		response.status = 400;
		response.message = "invalid userId";
		throw response;
	}

	//set resetPasswordKey in db
	user.resetPassordKey = uuid.v4();
	await user.save()
		.then(result => {
			logger.info("Successfully assigned resetPasswordKey for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	//set email of "one time use" reset password link
	await helper.sendforgetPasswordEmail(resetPassordKey, targetUser.emailAddress)
		.catch(err => {
			response.status = 500;
			response.message = "helper.sendforgetPasswordEmail() is not available";
			throw response;
		});

	return;
}

function updateEmailAddress(input) {
	var response = new Object();

	//validate userId
	if (input.userId == null || input.userId.length == 0) {
		response.status = 401;
		response.message = "userId is mandatory";
		throw response;
	}

	var user;
	await User.findById(input.userId)
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("Error while running User.findById() : " + err);
			response.status = 500;
			response.message = "User.findById() is not available";
			throw response;
		});

	if (user == null) {
		response.status = 400;
		response.message = "Invalid userId";
		throw response;
	}

	//validate emailAddress
	if (input.emailAddress == null || input.emailAddress.length == 0) {
		response.status = 401;
		response.message = "emailAddress is mandatory";
		throw response;
	}

	//TODO validate email address format

	//update emailAddress in user record
	user.emailAddress = input.emailAddress;
	user.save()
		.then(result => {
			logger.info("Successfully updated emailAddress for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	return;
}

function userToOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user.id;
	outputObj.emailAddress = user.emailAddress;
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;
	outputObj.groups = user.groups;
	outputObj.name = user.name;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.history = user.history;
	outputObj.userType = user.userType;
	outputObj.telephoneCountryCode = user.telephoneCountryCode;
	outputObj.telephoneNumber = user.telephoneNumber;

	return outputObj;
}

module.exports = {
	forgetPassword,
	deactivateUser,
	activateUser,
	adminActivateUser,
	register,
	findUser,
	fetchAllUsers,
	updateEmailAddress,
	assignGroup
}