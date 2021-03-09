const Joi = require("joi");
const uuid = require("uuid");

const utility = require("../common/utility");
const {logger, customError} = utility;

const User = require("./user.model").User;
const socialProfileHelper = require("./socialProfile.helper");

const NEW_USER_REGISTERED_Q_NAME = "newUserRegistered";

async function invitedSocialRegister(input){
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("FACEBOOK", "GOOGLE")
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
	let existingUser;
	try {
		existingUser = await User.findOne(
			{
				provider: socialProfile.provider,
				providerUserId: socialProfile.providerUserId
			});
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already exist" };
	
	//check if party is already registered
	try {
		existingUser = await User.findOne(
			{
				partyId: input.partyId
			});
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Party already registered" };

	let newUser = new User();
	newUser.registrationTime = new Date();
	newUser.activationKey = uuid.v4();
	newUser.status = "AWAITING_ACTIVATION";
	newUser.partyId = input.partyId;
	newUser.provider = input.provider;
	newUser.providerUserId = input.providerUserId;

	try {
		newUser = await newUser.save();
	} catch (error) {
		logger.error("newUser.save() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save New User Error" };
	}

	const msg = {
		userId: newUser._id,
		partyId: newUser.partyId,
		name: socialProfile.name,
		emailAddress: socialProfile.email,
		pictureUrl: socialProfile.pictureUrl
	}

	await utility.publishEvent(msg, NEW_USER_REGISTERED_Q_NAME, newUser, async () => {
		logger.error("rolling back create new user");
		
		try{
			await User.findOneAndDelete({ _id: newUser._id });
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Rollback Delete User Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_USER_REGISTERED_Q_NAME} queue`, 
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
	try {
		existingUser = await User.findOne(
			{
				partyId: input.partyId
			});
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Party already registered" };

	let newUser = new User();
	newUser.registrationTime = new Date();
	newUser.activationKey = uuid.v4();
	newUser.status = "AWAITING_ACTIVATION";
	newUser.partyId = input.partyId;

	try {
		newUser = await newUser.save();
	} catch (error) {
		logger.error("newUser.save() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save New User Error" };
	}

	const msg = {
		userId: newUser._id,
		partyId: newUser.partyId
	}

	await utility.publishEvent(msg, NEW_USER_REGISTERED_Q_NAME, newUser, async () => {
		logger.error("rolling back create new user");
		
		try{
			await User.findOneAndDelete({ _id: newUser._id });
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Rollback Delete User Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_USER_REGISTERED_Q_NAME} queue`, 
		newUserRegisteredEventMsg: msg
	};
}

module.exports = {
	invitedSocialRegister,
	invitedRegister
}