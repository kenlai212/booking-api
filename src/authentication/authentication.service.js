"use strict";
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const userHelper = require("./user_internal.helper");
const partyHelper = require("./party_internal.helper");
const socialProfileHelper = require("../common/profile/socialProfile.helper");

const ACCESS_TOKEN_EXPIRES = "1h";

async function socialLogin(input){
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("GOOGLE","FACEBOOK"),
		token: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let socialProfile;
	switch(input.provider){
		case "GOOGLE":
			socialProfile = await socialProfileHelper.getSocialProfileFromGoogle(input.token);
		break;
		case "FACEBOOK":
			socialProfile = await socialProfileHelper.getSocialProfileFromFacebook(input.token);
		break;
		default:
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Profider" };
	}
	
	return await assembleToken(socialProfile);
}

async function assembleToken(socialProfile) {
	//find user
	let targetUser;
	try {
		targetUser = await userHelper.getSocialUser(socialProfile.provider, socialProfile.providerUserId);
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

	//set output object
	const output = {
		"id": targetUser.id,
		"personalInfo": targetUser.personalInfo,
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
	userHelper.updateLastLogin(targetUser.id)
	.catch(() => {
		logger.error(`Token issued to User(${targetUser.id}) at ${output.lastLoginTime}, but fialed to updateLastLogin(). Please patch manually.`);
	});

	return token;
}

module.exports = {
	socialLogin
}