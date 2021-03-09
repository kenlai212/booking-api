"use strict";
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const utility = require("../common/utility");
const {logger, customError} = utility;

const socialProfileHelper = require("./socialProfile.helper");
const {Claim} = require("./claim.model");

const ACCESS_TOKEN_EXPIRES = "1h";

async function socialLogin(input){
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

	let claim
	try {
		claim = await Claim.findOne({
			"provider": socialProfile.provider,
			"providerUserId": socialProfile.providerUserId
		});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//set output object
	const output = {
		"userId": claim.userId,
		"partyId": claim.partyId,
		"status": claim.userStatus
	}

	//sign output object into token
	let token;
	try{
		token = jwt.sign(output, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	}catch(error){
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return token;
}

module.exports = {
	socialLogin
}