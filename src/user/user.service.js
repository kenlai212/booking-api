"use strict";
const uuid = require("uuid");
const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const authenticationService = require("../authentication/authentication.service");
const activationEmailService = require("./activationEmail.service");
const userObjectMapper = require("./userObjectMapper.helper");

const ACTIVE_STATUS = "ACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

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
				name: Joi
					.string()
					.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		authenticationService.checkLoginIdAvailability({loginId: loginId})
			.then(isAvailable => {
				if (isAvailable == false) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "LoginId already taken" });
				}

				return;
			})
			.then(() => {
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

				return newUser.save();
			})
			.then(newUser => {
				//save credential
				authenticationService.addNewCredentials({
					loginId: input.loginId,
					password: input.password,
					userId: newUser.id
				});

				return newUser;
			})
			.then(newUser => {
				//set sendActivationEmail input flag, default to false if not provided
				if (input.sendActivationEmail != true) {
					var outputObj = userObjectMapper.toOutputObj(newUser)
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
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function activateUser(input, user){
	return new Promise(async (resolve, reject) => {
		//TODO validate user either admin or self

		//validate input data
		const schema = Joi.object({
			activationKey: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//find user
		User.findOne({
			"activationKey": input.activationKey
		})
			.then(user => {
				//if no user found using the activation key,
				//it's a bad key
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid activationKey" });
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

				return user;
			})
			.then(user => {
				resolve(user.save());
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function forgetPassword(input){
	return new Promise(async (resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			userId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//find targetUser
		User.findById(input.userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "invalid userId" });
				}

				//set resetPasswordKey
				user.resetPassordKey = uuid.v4();

				return user;
			})
			.the(user => {
				return user.save();
			})
			.the(user => {
				//TODO write(or find) this fucntion
				sendforgetPasswordEmail(user);

				resolve();
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function updateEmailAddress(input, user) {
	return new Promise(async (resolve, reject) => {
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
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		User.findById(input.userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "invalid userId" });
				}

				//update emailAddress in user record
				user.emailAddress = input.emailAddress;

				//set history
				const historyItem = {
					transactionTime: moment().toDate(),
					transactionDescription: "Updated email address"
				}
				user.history.push(historyItem);

				return user;
			})
			.then(user => {
				resolve(user.save());
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function updateTelephoneNumber(input, user) {
	return new Promise(async (resolve, reject) => {
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

		User.findById(input.userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "invalid userId" });
				}

				//update telephoneCountry and telephoneNumber and  in user record
				user.telephoneCountryCode = input.telephoneCountryCode;
				user.telephoneNumber = input.telephoneNumber;

				//set history
				const historyItem = {
					transactionTime: moment().toDate(),
					transactionDescription: "Updated telephone number"
				}
				user.history.push(historyItem);

				return user;
			})
			.then(user => {
				resolve(user.save());
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	activateUser,
	socialRegister,
	register,
	forgetPassword,
	updateEmailAddress,
	updateTelephoneNumber
}