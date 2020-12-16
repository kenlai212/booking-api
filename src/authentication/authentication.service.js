"use strict";
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const userHelper = require("./user_internal.helper");
const partyHelper = require("./party_internal.helper");

const ACCESS_TOKEN_EXPIRES = "1h";

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
	utility.validateInput(schema, input);

	let socialUser = {
		provider: input.provider,
		providerUserId: null,
		name: null,
		emailAddress: null,
		image: null
	}
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

			socialUser.providerUserId = payload.sub;
			socialUser.name = payload.name;
			socialUser.emailAddress = payload.email;
			socialUser.pictureUrl = payload.picture;
	}

	if(input.provider == "FACEBOOK"){
		const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${input.token}`;

		const response = await axios.get(url);
		const data = response.data;
	
		socialUser.providerUserId = data.id;
		socialUser.name = data.name;
		socialUser.emailAddress = data.email;
		socialUser.pictureUrl = data.picture.data.url;
	}
	
	return await assembleToken(socialUser);
}

async function assembleToken(socialUser) {
	//find user
	let targetUser;
	try {
		targetUser = await userHelper.getSocialUser(socialUser.provider, socialUser.providerUserId);
	} catch (err) {
		//if no user found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//check if targetUser is activated
	//cannot assemble a token if user is targetUser is inactive
	if (targetUser.status != "ACTIVE") {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Inactive user" };
	}

	//find party
	let targetParty;
	try{
		targetParty = await partyHelper.getParty(targetUser.partyId);
	}catch(err){
		//if no party found, its a login error
		if (err.name == customError.RESOURCE_NOT_FOUND_ERROR) {
			throw { name: customError.UNAUTHORIZED_ERROR, message: "Login failed" };
		} else {
			throw err;
		}
	}

	//update party profile if attributes are different then socialUser attributes
	let profile = new ProfileInput();
	let differenceDetected = false;

	if(targetParty.name != socialUser.name){
		differenceDetected = true;
		profile.name = socialUser.name;
	}

	if(targetParty.contact != null){
		if(targetParty.contact.emailAddress != socialUser.emailAddress){
			differenceDetected = true;
			profile.emailAddress = socialUser.emailAddress;
		}
	}

	if(targetParty.picture != null){
		if(targetParty.picture.url != socialUser.pictureUrl){
			differenceDetected = true;
			profile.picture.url = socialUser.pictureUrl;
		}
	}

	if(differenceDetected){
		try{
			partyHelper.updateProfile(targetParty.id, profile).then(() => {
				logger.info(`Update Party record (${JSON.stringify(profile)})`);
			});
		}catch(error){
			logger.error("partyHelper.updateProfile error : ", error);
			logger.error(`Party record is outsync with provider record (${socialUser}), either patch manually or wait for user to login next time and trigger auto update again`);
		}
	}

	//set output object
	const output = {
		"id": targetUser.id,
		"name": targetUser.name,
		"contact": targetParty.contact,
		"picture": targetParty.picture,
		"provider": targetUser.provider,
		"providerUserId": targetUser.providerUserId,
		"status": targetUser.status,
		"groups": targetUser.groups,
		"lastLoginTime": moment().toDate()
	}

	//sign output object into token
	let token;
	try{
		token = jwt.sign(output, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	}catch(error){
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//update last login time on user record
	try {
		await userHelper.updateLastLogin(targetUser.id);
	} catch (err) {
		logger.error("userHelper.updateLastLogin error : ", err);
		logger.error(`Token issued to User(${targetUser.id}) at ${output.lastLoginTime}, but fialed to updateLastLogin(). Please patch manually.`);
	}

	return token;
}

class SocialUser{
	constructor(provider, providerUserId, name, emailAddress, pictureUrl){
		this.provider = provider;
		this.providerUserId = providerUserId;
		this.name = name;
		this.emailAddress = emailAddress;
		this.pictureUrl = pictureUrl;
	}
}

class ProfileInput{
	constructor(name, telephoneCountryCode, telephoneNumber, emailAddress, pictureUrl) {
		this.name = name;
		this.telephoneCountryCode = telephoneCountryCode;
		this.telephoneNumber = telephoneNumber;
		this.emailAddress = emailAddress;
		this.pictureUrl = pictureUrl;
	}	
}

module.exports = {
	socialLogin
}