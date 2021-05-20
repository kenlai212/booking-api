"use strict";
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const utility = require("../common/utility");
const {logger, customError} = utility;

const credentialsService = require("./credentials.service");
const claimService = require("./claim.service");
const authenticationHelper = require("./authentication.helper");

const ACCESS_TOKEN_EXPIRES = "1h";

async function login(input){
	const schema = Joi.object({
		loginId: Joi.string(),
		password: Joi.string(),
		provider: Joi.string(),
		providerToken: Joi.string()
	});
	utility.validateInput(schema, input);

	if(!input.loginId && !input.providerToken)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide loginId or providerToken" };

	let credentials;
	if(input.loginId){
		if(!input.password)
		throw { name: customError.BAD_REQUEST_ERROR, message: "password is mandatory" };

		credentials = await credentialsService.readCredentials({
			loginId: input.loginId,
			password: input.password
		});

	}else if(input.providerToken){
		let socialProfile;
		switch(input.provider){
			case "GOOGLE":
				socialProfile = await authenticationHelper.getSocialProfileFromGoogle(input.token);
			break;
			case "FACEBOOK":
				socialProfile = await authenticationHelper.getSocialProfileFromFacebook(input.token);
			break;
			default:
				throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Profider" };
		}
	
		credentials = await credentialsService.readCredentials({
			provider: socialProfile.provider,
			providerUserId: socialProfile.providerUserId
		});
	}

	const claim = await claimService.findClaim({userId: credentials.userId});

	//sign claim into token
	let token;
	try{
		token = jwt.sign(claim, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	}catch(error){
		logger.error("jwt.sign error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return token;
}

async function register(input){
	const schema = Joi.object({
		userId: Joi.string().required(),
		userStatus: Joi.string().required(),
		personId: Joi.string().required(),
		loginId: Joi.string(),
		password: Joi.string(),
		provider: Joi.string(),
		providerToken: Joi.string(),
		groups: Joi.array().items(Joi.string()),
        roles: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

	if(!input.loginId && !input.providerToken)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide loginId or providerToken" };

	if(input.providerToken){
		if(!input.provider)
		throw { name: customError.BAD_REQUEST_ERROR, message: "provider is mandatory" };
	}

	if(input.loginId){
		if(!input.password)
		throw { name: customError.BAD_REQUEST_ERROR, message: "password is mandatory" };
	}

	//add new claim
	const newClaimInput = {
    	userId: input.userId,
		personId: input.personId,
        userStatus: input.userStatus,
        groups: input.groups,
        roles: input.roles
	}

	await claimService.newClaim(newClaimInput);

	//add new credentials
	let newCredentialsInput = new Object();
	newCredentialsInput.userId =  input.userId;
	
	if(input.providerToken){
		let socialProfile;
		switch(input.provider){
			case "GOOGLE":
				socialProfile = await authenticationHelper.getSocialProfileFromGoogle(input.token);
			break;
			case "FACEBOOK":
				socialProfile = await authenticationHelper.getSocialProfileFromFacebook(input.token);
			break;
			default:
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Profider" };
		}
	
		newCredentialsInput.provider = socialProfile.provider;
		newCredentialsInput.providerUserId = socialProfile.providerUserId
	}else if(input.loginId){
		newCredentialsInput.loginId = input.loginId;
		newCredentialsInput.password = input.password
	}

	await credentialsService.newCredentials(newCredentialsInput);

	return {status: "SUCCESS"}
}

module.exports = {
	login,
	register
}