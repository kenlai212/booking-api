const moment = require("moment");
const Joi = require("joi");
const uuid = require("uuid");
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const User = require("./user.model").User;
const authenticationHelper = require("./authentication_internal.helper");
const activationEmailHelper = require("./activationEmail.helper");
const userObjectMapper = require("./userObjectMapper.helper");
const userHistoryService = require("./userHistory.service");
const partyHelper = require("./party_internal.helper");

const AWAITING_ACTIVATION_STATUS = "AWAITING_ACTIVATION";
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

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

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
	let party;
	try{
		party = await partyHelper.createNewParty(name, null, null, emailAddress, image, null);
	}catch(err){
		logger.error("partyHelper.addNewParty() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	var newUser = new User();
	newUser.name = name;
	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();
	newUser.provider = input.provider;
	newUser.providerUserId = providerUserId;
	newUser.partyId = party.id;

	//save newUser record to db
	try {
		newUser = await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
		logger.error(`New party(${party.id}) created, but newUser.save failed`);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init userHistory
	const historyItem = {
		userId: newUser._id.toString(),
		transactionDescription: "New User registered"
	}

	try {
		await userHistoryService.initUserHistory(historyItem);
	} catch (err) {
		logger.error("userHistoryService.initUserHistory() error : ", err);
		logger.error(`User record(${newUser._id.toString()}) created, but initUserHistory failed.`);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//map to output obj
	let outputObj = userObjectMapper.toOutputObj(newUser);
	outputObj.activationKey = newUser.activationKey;

	return outputObj;
}

async function register(input) {
	//validate input data
	const schema = Joi.object({
		loginId: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		password: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		emailAddress: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		name: Joi
			.string()
			.min(1)
			.max(255)
			.required(),
		sendActivationEmail: Joi
			.boolean()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check loginId availibility
	let isAvailable;
	try {
		isAvailable = await authenticationHelper.checkLoginIdAvailability(input.loginId);
	} catch (err) {
		logger.error("authenticationHelper.checkLoginAvailability() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (isAvailable == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "LoginId already taken" };
	}

	//save new user
	var newUser = new User();
	newUser.provider = "GOGOWAKE"
	newUser.emailAddress = input.emailAddress;
	newUser.name = input.name;

	newUser.status = AWAITING_ACTIVATION_STATUS;
	newUser.registrationTime = moment().toDate();
	newUser.activationKey = uuid.v4();

	try {
		newUser = await newUser.save();
	} catch (err) {
		logger.error("newUser.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init userHistory
	const histroyItem = {
		userId: newUser._id.toString(),
		transactionDescription: "New Social User registered"
	}

	try {
		await userHistoryService.initUserHistory(histroyItem);
	} catch (err) {
		logger.error("userHistoryService.initUserHistory() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save credential
	try {
		await authenticationHelper.addNewCredentials(input.loginId, input.password, newUser.id);
	} catch (err) {
		logger.error("Rolling back newUser.save()", err);
		//TODO roll back newUser.save();

		logger.error("authenticationHelper.addNewCredentials error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	historyItem = {
		targetUserId: newUser._id.toString(),
		triggerByUser: newUser
	}

	//if input.sendActivationEmail is not ture, then resolve immediately
	if (input.sendActivationEmail == true) {
		try {
			let sentActivationEmailResult = await activationEmailHelper.sendActivationEmail(newUser.activationKey, newUser.emailAddress);

			//save userHistroy to reflect activation email sent
			historyItem.transactionDescription = "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId;
			try {
				await userHistoryService.addHistoryItem(historyItem);
			} catch (err) {
				logger.error("userHistoryService.addHistoryItem() error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
		} catch (err) {
			logger.error("authenticationHelper.addNewCredentials error : ", err);

			//save userHistroy to reflect activation email failed
			historyItem.transactionDescription = "Sent activation email to user. MessageID : " + sentActivationEmailResult.messageId;
			try {
				await userHistoryService.addHistoryItem(historyItem);
			} catch (err) {
				logger.error("userHistoryService.addHistoryItem() error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}

			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
	}

	//map to output obj
	let outputObj = userObjectMapper.toOutputObj(newUser);
	outputObj.activationKey = newUser.activationKey;

	return outputObj;
}

module.exports = {
	register,
	socialRegister
}