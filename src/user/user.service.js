"use strict";
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;

const EMAIL_PATH = "/email";

const ACTIVE_STATUS = "ACTIVE";
const INACTIVE_STATUS = "INACTIVE";
const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";
const USER_ADMIN_GROUP = "USER_ADMIN_GROUP";
const AUTHENTICATION_ADMIN_GROUP = "AUTHENTICATION_ADMIN_GROUP";
const VALID_USER_GROUPS = [
	BOOKING_ADMIN_GROUP,
	BOOKING_USER_GROUP,
	USER_ADMIN_GROUP,
	AUTHENTICATION_ADMIN_GROUP
]

const LOGIN_ID_PATH = "/loginId";
const CREDENTIALS_PATH = "/credentials";
const LOGOUT_PATH = "/logout";

function register(input){
	return new Promise(async (resolve, reject) => {
		var newUser = new User();

		//set provider
		const validProviders = ["FACEBOOK", "GOOGLE", "GOGOWAKE"];
		if (input.provider != null) {
			if (validProviders.includes(input.provider)) {
				newUser.provider = input.provider
			} else {
				reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid provider" });
			}
		} else {
			newUser.provider = "GOGOWAKE";
		}

		//set providerUserId, if external provider
		if (newUser.provider != "GOGOWAKE") {
			if (input.providerUserId == null || input.providerUserId.length < 1) {
				reject({ name: customError.BAD_REQUEST_ERROR, message: "providerUserId is mandatory" });
			}

			newUser.providerUserId = input.providerUserId;

			//check if providerUserId already exist
			await User.findOne(
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
		}

		//validate email
		if(input.emailAddress==null || input.emailAddress.length == 0){
			reject({ name: customError.BAD_REQUEST_ERROR, message: "emailAddress is mandatory" });
		}
		newUser.emailAddress = input.emailAddress;

		//set telephone
		const validTelephoneCountryCode = ["852", "853", "86"];
		if (input.telephoneCountryCode != null && input.telephoneCountryCode.length > 1) {

			if (validTelephoneCountryCode.includes(input.telephoneCountryCode) == false) {
				reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid telephoneCountryCode" });
			}
			newUser.telephoneCountryCode = input.telephoneCountryCode;

			//telephoneNumber is mandatory if countryCode not null
			if (input.telephoneNumber == null || input.telephoneNumber.length == 0) {
				reject({ name: customError.BAD_REQUEST_ERROR, message: "telephoneNumber is mandatory" });
			}

			input.telephoneNumber = input.telephoneNumber.replace(/[^\w\s]/gi, '');
			newUser.telephoneNumber = input.telephoneNumber;
		}

		//validate name
		if (input.name == null || input.name.length < 1) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "name is mandatory" });
		}
		newUser.name = input.name;

		//default userType to be PERSON_USER
		if (input.userType == null || input.userType.length < 1) {
			input.userType = "PERSON_USER";
		}

		const validUserTypes = ["SYSTEM_USER", "PERSON_USER"]
		if (validUserTypes.includes(input.userType) == false) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid userType" });
		}
		newUser.userType = input.userType;

		//TODO validate groups
		if (input.groups != null) {
			newUser.groups = input.groups;
		}

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
		await newUser.save()
			.then(result => {
				newUser = result;
			})
			.catch(err => {
				logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Delete function not available" });
			});

		//if provider is GOGOWAKE, validate and set loginId & password
		if (newUser.provider == "GOGOWAKE") {

			//validate loginId
			if (input.loginId == null || input.loginId.length == 0) {
				response.status = 400;
				response.message = "loginId is mandatory";
				throw response;
			}

			//validate password
			if (input.password == null || input.password.length == 0) {
				response.status = 400;
				response.message = "password is mandatory";
				throw response;
			}

			//look for existing credentials with same loginId by calling loginId API,
			//if found, throw 400 error
			var url = process.env.AUTHENTICATION_DOMAIN + LOGIN_ID_PATH + "?loginId=" + input.loginId;
			var requestAttr = {
				method: "GET",
				headers: {
					"content-Type": "application/json",
					"Authorization": "Token " + global.accessToken
				}
			}

			var isAvailable
			await common.callAPI(url, requestAttr)
				.then(result => {
					isAvailable = result.isAvailable;
				})
				.catch(() => {
					response.status = 500;
					response.message = "loginId availability api is not available";
					throw response;
				});

			if (isAvailable == false) {
				response.status = 400;
				response.message = "LoginId already taken";
				throw response;
			}

			//set and save credentials
			url = process.env.AUTHENTICATION_DOMAIN + CREDENTIALS_PATH;
			requestAttr = {
				method: "POST",
				headers: {
					"content-Type": "application/json",
					"Authorization": "Token " + global.accessToken
				},
				body: JSON.stringify({
					loginId: input.loginId,
					password: input.password,
					userId: newUser.id
				})
			}

			await common.callAPI(url, requestAttr)
				.then(() => {
					logger.info("Successfully save credentials : " + input.loginId);
				})
				.catch(err => {
					logger.error("Error while calling new credentials api : " + err);

					//credentials.save had failed roll back newUser record
					User.findByIdAndDelete(newUser.id)
						.exec()
						.catch(err => {
							logger.error("Errror while rolling back newUser record : " + err);
						});

					response.status = 500;
					response.message = "save credentials api is not available";
					throw response;
				});
		}
		
		//set sendActivationEmail input flag, default to false if not provided
		if (input.sendActivationEmail == null) {
			input.sendActivationEmail = false;
		}

		//send activation email only if both system flag and input flag is true 
		if (process.env.SEND_ACTIVATION_EMAIL == true & input.sendActivationEmail == true) {

			await sendActivationEmail(newUser.activationKey, newUser.emailAddress)
				.then(result => {
					const historyItem = {
						transactionTime: common.getNowUTCTimeStamp(),
						transactionDescription: "Sent activation email to user. MessageID : " + result.messageId
					}
					newUser.history.push(historyItem);
				})
				.catch(() => {
					const historyItem = {
						transactionTime: common.getNowUTCTimeStamp(),
						transactionDescription: "Failed to send activation email to user"
					}
					newUser.history.push(historyItem);
				});

			await newUser.save()
				.then(() => {
					logger.info("Successfully updated user.history with activation email status");
				})
				.catch(err => {
					logger.error("Error while running newUser.save() : " + err);
				})
		}
		
		var outputObj = userToOutputObj(newUser);
		outputObj.activationKey = newUser.activationKey;
		
		return outputObj;
	});
}

/**
 * By : Ken Lai
 * Date : Jund 16, 2020
 * 
 * private function send activation email. Use by register and resendActivationEmail
 * */
async function sendActivationEmail(activationKey, recipent) {
	const url = process.env.NOTIFICATION_DOMAIN + EMAIL_PATH;

	const activationURL = process.env.ACTIVATION_URL + "/" + activationKey;
	const bodyHTML = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";

	const data = {
		"sender": "registration@hebewake.com",
		"recipient": recipent,
		"emailBody": bodyHTML
	}

	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		},
		body: JSON.stringify(data)
	}

	await common.callAPI(url, requestAttr)
		.then(result => {
			logger.info("Successfully sent activation email to new user : " + newUser.id + ", messageId : " + result.messageId);
		})
		.catch(err => {
			logger.error("Failed to send activation email to new user : " + err);
			throw err
		});

	return;
}

async function activateUser(input){
	
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

async function deactivateUser(input){

	var response = new Object();

	//validate userId
	if (input.userId == null || input.userId.length == 0){
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}
	
	//find targetUser
	var user;
	await User.findById(input.userId)
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("Error while running User.findBuyId() : " + err);
			response.status = 500;
			response.message = "User.findBuyId() is not available";
			throw response;
		});

	if(user == null){
		response.status = 400;
		response.message = "invalid userId";
		throw response;
	}
	
	//update user status to db
	user.status = INACTIVE_STATUS;
	user.lastUpdateTime = new Date();

	const historyItem = {
		transactionTime: common.getNowUTCTimeStamp(),
		transactionDescription: "User Deactived"
	}
	user.history.push(historyItem);

	await user.save()
		.then(result => {
			logger.info("Sucessfully updated INACTIVE status for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	//call logout api to purge all refresh tokens of this user
	const url = process.env.AUTHENTICATION_DOMAIN + LOGOUT_PATH;
	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		},
		body: JSON.stringify({
			userId: user.id
		})
	}

	await common.callAPI(url, requestAttr)
		.then(() => {
			logger.info("Successfully logout for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while calling external logout api : " + err);
		});

	return {"status" : INACTIVE_STATUS};
}

/*
* By : Ken Lai
* Date : Mar 31, 2020
*
* resend activation email
* only callable by admin
*/
async function resendActivationEmail(input) {
	var response = new Object();

	//TODO add admin authorization

	if (input.userId == null || input.userId.length < 1) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	//get user
	var user;
	User.findById(userId)
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
		response.message = "Invalid User ID";
		throw response;
	}

	//update activation key and set AWAITING_ACTIVATION status
	user.activationKey = uuid.v4();
	user.lastUpdateTime = new Date();
	user.status = AWAITING_ACTIVATION_STATUS;
	await user.save()
		.then(() => {
			logger.info("Successfully set new activation key and updated AWAITING_ACTIVATION status for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	//send activation email
	await sendActivationEmail(user.activationKey, user.emailAddress)
		.then(result => {
			const historyItem = {
				transactionTime: common.getNowUTCTimeStamp(),
				transactionDescription: "Sent activation email to user. MessageID : " + result.messageId
			}
			user.history.push(historyItem);
		})
		.catch(() => {
			const historyItem = {
				transactionTime: common.getNowUTCTimeStamp(),
				transactionDescription: "Failed to send activation email to user"
			}
			user.history.push(historyItem);
		});

	await user.save()
		.then(() => {
			logger.info("Successfully updated user.history with activation email status");
		})
		.catch(err => {
			logger.error("Error while running newUser.save() : " + err);
		});

	return {"status" : status};
}

/*
* By : Ken Lai
* Date : Mar 31, 2020

* adminstartive active user. No activation email necessary
* only callable by admin
*/
async function adminActivateUser(input) {
	var response = new Object();

	//TODO!!!!! set admin authentication

	if (input.userId == null || input.userId.length < 1) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	//get user
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

	if(user == null){
		response.status = 400;
		response.message = "Invalid User ID";
		throw response;
	}
	
	//update user status
	user.status = ACTIVE_STATUS;
	user.lastUpdateTime = new Date();
	user.activationKey = null;
	user.save()
		.then(result => {
			logger.info("Successfully activated user : " + user.id);
		})
		.catch(err => {
			response.status = 400;
			response.message = "userModel.activateUser() is not available";
			throw response;
		});

	return {"status" : ACTIVE_STATUS};
}

async function forgetPassword(input){

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

async function updateEmailAddress(input) {
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

async function assignGroup(input) {
	var response = new Object();
	
	//validate userId
	if (input.userId == null || input.userId.length == 0) {
		response.status = 400;
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
		response.message = "invalid userId";
		throw response;
	}

	//validate groupId
	if (input.groupId == null || input.groupId.length == 0) {
		response.status = 400;
		response.message = "groupId is mandatory";
		throw response;
	}

	user.groups.push(input.groupId);

	await user.save()
		.then(() => {
			logger.info("Successfully updated groups for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	return {"status":"SUCCESS"};
}

/**
 * By : Ken Lai
 * Date : Mar 15, 2020
 * 
 * find user by id or by accessToken, or provider with providerUserId
 */
async function findUser(input){
	var response = new Object();
	var userId;
	var user;

	if (input.provider != null) {
		//has provider, must user provideUserId
		if (input.providerUserId == null || input.providerUserId.length < 1) {
			response.status = 400;
			response.message = "providerUserId is mandatory";
			throw response;
		}
		
		//find user with provider and providerUserId
		await User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
			.exec()
			.then(result => {
				user = result;
			})
			.catch(err => {
				logger.error("Error while running User.find() : " + err);
				response.status = 500;
				response.message = "User.find() is not available";
				throw response;
			});

	} else {
		//no provider, must use userId or accessToken

		if ((input.userId == null || input.userId.length < 1) && (input.accessToken == null || input.accessToken.length < 1)) {
			response.status = 400;
			response.message = "must provide userId or accessToken";
			throw response;
		}

		if (input.userId != null) {
			userId = input.userId;
		} else {
			jwt.verify(input.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
				if (err) {
					logger.error("Error while running jwt.verify() : " + err);
					response.status = 500;
					response.message = "jwt.verify() is not available";
					throw response;
				}

				userId = user.id;
			});
		}

		await User.findById(userId)
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
	}

	if (user == null) {
		response.status = 404;
		response.message = "No user found";
		throw response;
	}

	var outputObj
	outputObj = userToOutputObj(user);

	return outputObj;
}

/**
* By : Ken Lai
* Date : Mar 30, 2020
*
* fetch all users, paginated
* only callable for admin group
*/
async function fetchAllUsers() {
	var response = new Object();

	//TODO!!!! add paginateion
	//TODO!!!! add admin group authorization

	var users;
	await User.find()
		.then(result => {
			users = result;
		})
		.catch(err => {
			logger.error("Error while running User.find() : " + err);
			response.status = 500;
			response.message = "User.find() is not available";
			throw response;
		});

	var outputObjs = [];
	users.forEach(function (user, index) {
		var outputObj = userToOutputObj(user);
		outputObjs.push(outputObj);
	});

	return { "users" : outputObjs };
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
	resendActivationEmail,
	register,
	findUser,
	fetchAllUsers,
	updateEmailAddress,
	assignGroup,
	seedRootUser
}