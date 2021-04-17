const Joi = require("joi");
const uuid = require("uuid");

const utility = require("../common/utility");
const {logger, customError} = utility;

const userDomain = require("./user.domain");
const socialProfileHelper = require("./socialProfile.helper");

const NEW_USER_QUEUE_NAME = "NEW_USER";

async function invitedSocialRegister(input){
	const schema = Joi.object({
		provider: Joi
			.string()
			.required(),
		providerToken: Joi
			.string()
			.required(),
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	socialProfileHelper.validateProvider(input.provider);

	//get user attributes form provider token
	let socialProfile;
	switch(input.provider){
		case "GOOGLE":
			socialProfile = await socialProfileHelper.getSocialProfileFromGoogle(input.providerToken);
			break;
		case "FACEBOOK":
			socialProfile = await socialProfileHelper.getSocialProfileFromFacebook(input.providerToken);
			break;
		default:
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Profider" };
	}

	//check social profile already used
	let existingUser = userDomain.readUserBySocialProfile(socialProfile.provider, socialProfile.providerUserId);

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already exist" };
	
	//check if party is already registered
	existingUser = await userDomain.readUserByPartyId(input.partyId);

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Party already registered" };

	let createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: "AWAITING_ACTIVATION",
		partyId: input.partyId,
		provider: input.provider,
		providerUserId: input.providerUserId
	}
		
	await userDomain.createUser(createUserInput);

	const msg = {
		userId: newUser._id,
		partyId: newUser.partyId,
		name: socialProfile.name,
		emailAddress: socialProfile.email,
		pictureUrl: socialProfile.pictureUrl
	}

	await utility.publishEvent(msg, NEW_USER_QUEUE_NAME, newUser, async () => {
		logger.error("rolling back create new user");
		
		await userDomain.deleteUser(user._id);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_USER_QUEUE_NAME} queue`, 
		newUserRegisteredEventMsg: msg
	};
}

async function invitedRegister(input){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	//check if party is already registered
	let existingUser = await userDomain.readUserByPartyId(input.partyId);

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Party already registered" };

	let createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: "AWAITING_ACTIVATION",
		partyId: input.partyId
	}
	
	let user = await userDomain.createUser(createUserInput);

	const msg = {
		userId: user._id,
		partyId: user.partyId
	}

	await utility.publishEvent(msg, NEW_USER_QUEUE_NAME, user, async () => {
		logger.error("rolling back create new user");
		
		await userDomain.deleteUser(user._id);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_USER_QUEUE_NAME} queue`, 
		newUserRegisteredEventMsg: msg
	};
}

module.exports = {
	invitedSocialRegister,
	invitedRegister
}