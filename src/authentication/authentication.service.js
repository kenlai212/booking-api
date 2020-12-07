"use strict";
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Credentials = require("./credentials.model").Credentials;
const userHelper = require("./user_internal.helper");

const ACCESS_TOKEN_EXPIRES = "1h";
const PASSWORD_HASH_STRENGTH = 10;

async function checkLoginIdAvailability(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.min(1)
			.max(255)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check loginId availability
	try {
		const credentials = await Credentials.findOne({ "loginId": input.loginId });

		if (credentials == null) {
			return { "isAvailable": true };
		} else {
			return { "isAvailable": false };
		}
	} catch (err) {
		logger.error("Credentials.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function addNewCredentials(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.required(),
		password: Joi
			.string()
			.required(),
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	try {
		const existingCredentials = await Credentials.findOne({ "loginId": input.loginId });
		//check loginId availability
		if (existingCredentials != null) {
			throw { name: "loginIdNotAvailableError", message: "loginId not available" };
		}
	} catch (err) {
		logger.error("Credentials.findOne error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//hash password
	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(input.password, PASSWORD_HASH_STRENGTH);
	} catch (err) {
		logger.error("bcrypt.hash error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	} 

	var newCredentials = new Credentials();
	newCredentials.hashedPassword = hashedPassword;
	newCredentials.loginId = input.loginId;
	newCredentials.userId = input.userId;
	newCredentials.createdTime = new Date();

	try {
		newCredentials = await newCredentials.save();
	} catch (err) {
		logger.error("newCredentials.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return newCredentials;
}

async function socialLogin(input){
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.min(1)
			.required(),
		token: Joi
			.string()
			.min(1)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let providerUserId;
	let name;
	let emailAddress;
	let image;

	if(input.provider == "GOOGLE"){
		const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

			let ticket;
			try{
				ticket = await client.verifyIdToken({
					idToken: input.token,
					audience: process.env.GOOGLE_CLIENT_ID
				});
			}catch(error){
				logger.warn("Google Oauth2Client.verifyIdToken() error : ", error);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
			
			const payload = ticket.getPayload();
			
			//google's payload.aud must match GOOGLE_CLIENT_ID
			if(payload.aud != process.env.GOOGLE_CLIENT_ID){
				logger.warn("Someone try to pass a google token with the wrong google Client ID");
				throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid GOOGEL_CLIENT_ID" };
			}

			providerUserId = payload.sub;
			name = payload.name;
			emailAddress = payload.email;
			image = payload.picture;
	}

	if(input.provider == "FACEBOOK"){
		const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${input.token}`;

		const response = await axios.get(url);
		const data = response.data;
	
		providerUserId = data.id;
		name = data.name;
		emailAddress = data.email;
		image = data.picture.data.url;
	}
	
	//find user
	let user;
	try {
		user = await userHelper.getSocialUser(input.provider, providerUserId);
	} catch (err) {
		//if no user found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//set user attributes from provider
	user.name = name;
	user.emailAddress = emailAddress;
	if(image != null){
		user.image = image;
	}
	user.lastLoginTime = moment().toDate();
	
	//check if user is activated
	if (user.status != "ACTIVE") {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Inactive user" };
	}
	
	//sign user into token
	let token;
	try {
		token = userToToken(user);
	} catch (err) {
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//update last login time on user record
	try {
		await userHelper.updateLastLogin(user.id);
	} catch (err) {
		logger.error("userHelper.updateLastLogin error : ", err);
		logger.error(`Token issued to User(${user_id}), but fialed to updateLastLogin()`);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	return token;
}

async function login(input){
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.required(),
		password: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find credentials
	let credentials;
	try {
		credentials = await Credentials.findOne({ "loginId": input.loginId });
	} catch (err) {
		logger.error("newCredentials.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (credentials == null) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
	}
	
	//compare input.password with credentials record
	try {
		if (await bcrypt.compare(input.password, credentials.hashedPassword) == false) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		};
	} catch (err) {
		throw { name: customerError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//find user
	let user;
	try {
		user = await userHelper.getUser(credentials.userId);
	} catch (err) {
		//if no user found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//check user status
	if (user.status != "ACTIVE") {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Inactive User" };
	}

	//sign user into token
	let token;
	try {
		token = userToToken(user);
	} catch (err) {
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//update last login time on user record
	try {
		await userHelper.updateLastLogin(user.id);
	} catch (err) {
		logger.error("userHelper.updateLastLogin error : ", err);
		logger.error(`Token issued to User(${user_id}), but fialed to updateLastLogin()`);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return token;
}

function userToToken(user) {
	const output = {
		"id": user._id,
		"name": user.name,
		"emailAddress": user.emailAddress,
		"telephoneCountryCode": user.telephoneCountryCode,
		"telephoneNumber": user.telephoneNumber,
		"provider": user.provider,
		"providerUserId": user.providerUserId,
		"status": user.status,
		"groups": user.groups,
		"image": user.image,
		"lastLoginTime": user.lastLoginTime
	}

	return jwt.sign(output, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	socialLogin
}