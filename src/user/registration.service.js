const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const User = require("./user.model").User;
const userService = require("./user.service");
const socialProfileHelper = require("../common/profile/socialProfile.helper");

async function socialRegister(input) {
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.valid("FACEBOOK", "GOOGLE")
			.required(),
		providerToken: Joi
			.string()
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

	//check if user is already registered
	try {
		let existingSocialUser = await User.findOne(
			{
				provider: socialProfile.provider,
				providerUserId: socialProfile.providerUserId
			});
		
		if (existingSocialUser != null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already exist" };
		}
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save new party
	const createNewPartyInput = {
		personalInfo:{
			name: socialProfile.name
		},
		contact:{
			emailAddress: socialProfile.emailAddress
		},
		picture:{
			url: socialProfile.pictureUrl
		}
	}

	const newParty = await partyHelper.createNewParty(createNewPartyInput, null);

	//save new user
	let newUser;
	const addNewUserInput = {
		partyId: newParty.id,
		personalInfo: newParty.personalInfo,
		contact: newParty.contact,
		picture: newParty.picture,
		provider: socialProfile.provider,
		providerUserId: socialProfile.providerUserId
	}

	try{
		newUser =  await userService.createNewUser(addNewUserInput);
	}catch(error){
		logger.error(`Party(${newParty.id}) create, but addNewUser failed ${JSON.stringify(addNewUserInput)}`);

		//Roll back party

		throw error;
	}

	return newUser;
}

module.exports = {
	socialRegister
}