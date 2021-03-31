"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const personHelper = require("./person.helper");

async function sendRegistrationInvite(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let person = await personHelper.getPerson(input.personId);

	const contactMethod = personHelper.getContactMethod(person);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = "sendSMS";
			eventMsg = {
				subject: "Registration Invite",
				message: "Please click on the following link to register",
				number: `${person.countryCode}${person.phoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = "sendEmail";
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

	utility.publishEvent(eventMsg, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function sendMessage(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.required(),
		body: Joi
			.string()
			.min(1)
			.required(),
		title: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let person = await personHelper.getPerson(input.personId);

	const contactMethod = personHelper.getContactMethod(person);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = "sendSMS";
			eventMsg = {
				subject: input.title,
				message: input.body,
				number: `${person.countryCode}${person.phoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = "sendEmail";
			eventMsg = {
				subject: input.title,
				emailBody: input.body,
				recipient: person.emailAddress,
				sender: "admin@hebewake.com"
			}
		break;
		default:
			throw { name: customError.INTERNAL_SERVER_ERROR, message: `Bad contact method: ${contactMethod}` };
	}

	utility.publishEvent(eventMsg, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

module.exports = {
	sendMessage,
	sendRegistrationInvite
}