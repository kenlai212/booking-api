"use strict";
const Joi = require("joi");
const uuid = require("uuid");

const utility = require("../common/utility");
const {logger, customError} = utility;

const userDomain = require("./user.domain");
const registrationHelper = require("./registration.helper");
const personDomain = require("./person.domain");

const NEW_USER_QUEUE_NAME = "NEW_USER";
const SEND_SMS_QUEUE_NAME = "SEND_SMS";
const SEND_EMAIL_QUEUE_NAME = "SEND_EMAIL";

async function sendRegistrationInvite(input, user){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	const contactMethod = personHelper.getContactMethod(person);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = SEND_SMS_QUEUE_NAME;
			eventMsg = {
				subject: "Registration Invite",
				message: "Please click on the following link to register",
				number: `${person.countryCode}${person.phoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = SEND_EMAIL_QUEUE_NAME;
			eventMsg = {
				subject: "Registration Invite",
				emailBody: "Please click on the following link to register",
				recipient: person.emailAddress,
				sender: "admin@hebewake.com"
			}
		break;
		default:
			throw { name: customError.INTERNAL_SERVER_ERROR, message: `Bad contact method: ${contactMethod}` };
	}

	await utility.publishEvent(eventMsg, eventQueueName);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function invitedSocialRegister(input){
	const schema = Joi.object({
		provider: Joi.string().required(),
		providerToken: Joi.string().required(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	//get user attributes form provider token
	let socialProfile;
	switch(input.provider){
		case "GOOGLE":
			socialProfile = await registrationHelper.getSocialProfileFromGoogle(input.providerToken);
			break;
		case "FACEBOOK":
			socialProfile = await registrationHelper.getSocialProfileFromFacebook(input.providerToken);
			break;
		default:
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Provider" };
	}

	//check social profile already used
	let existingUser = await userDomain.readUserBySocialProfile(socialProfile.provider, socialProfile.providerUserId);

	if (existingUser)
	throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already registered" };
	
	//check if person is already registered
	existingUser = await userDomain.readUserByPersonId(input.personId);

	if (existingUser)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Person already registered" };

	let createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: "AWAITING_ACTIVATION",
		provider: input.provider,
		providerUserId: input.providerUserId,
		personId: person._id,
	}
		
	let newUser = await userDomain.createUser(createUserInput);

	const msg = {
		userId: newUser._id,
		person: person
	}

	await utility.publishEvent(msg, NEW_USER_QUEUE_NAME, async () => {
		logger.error("rolling back create new user");
		
		await userDomain.deleteUser(newUser._id);
	});

	return newUser;
}

async function invitedRegister(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	//check if person is already registered
	let existingUser = await userDomain.readUserByPersonId(input.personId);

	if (existingUser)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Person already registered" };

	let createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: "AWAITING_ACTIVATION",
		personId: input.personId
	}
	
	let user = await userDomain.createUser(createUserInput);

	const msg = {
		userId: user._id,
		person: person
	}

	await utility.publishEvent(msg, NEW_USER_QUEUE_NAME, async () => {
		logger.error("rolling back create new user");
		
		await userDomain.deleteUser(user._id);
	});

	return user;
}

module.exports = {
	sendRegistrationInvite,
	invitedSocialRegister,
	invitedRegister
}