const moment = require("moment");
const Joi = require("joi");
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const User = require("./user.model").User;
const userService = require("./user.service");
const partyHelper = require("./party_internal.helper");

const FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com";

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
	let providerUserId;
	let name;
	let emailAddress;
	let image;
	if(input.provider == "GOOGLE"){
		const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

		let ticket;
		try{
			ticket = await client.verifyIdToken({
				idToken: input.providerToken,
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
		const url = `${FACEBOOK_GRAPH_API_URL}/me?fields=id,name,email,picture&access_token=${input.providerToken}`;

		const response = await axios.get(url);
		const data = response.data;
	
		providerUserId = data.id;
		name = data.name;
		emailAddress = data.email;
		image = data.picture.data.url;
	}

	//check if user is already registered
	try {
		let existingSocialUser = await User.findOne(
			{
				provider: input.provider,
				providerUserId: providerUserId
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
			name: name
		},
		contact:{
			emailAddress: emailAddress
		},
		picture:{
			url: image
		}
	}

	const party = await partyHelper.createNewParty(createNewPartyInput, null);

	//save new user
	const addNewUserInput = {
		partyId: party.id,
		name: party.personalInfo.name,
		provider: input.provider,
		providerUserId: providerUserId
	}

	try{
		return await userService.createNewUser(addNewUserInput);
	}catch(error){
		logger.error(`Party(${party.id}) create, but addNewUser failed ${JSON.stringify(addNewUserInput)}`);
		throw error;
	}
}

module.exports = {
	socialRegister
}