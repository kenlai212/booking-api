"use strict";
const Joi = require("joi");
var uuid = require("uuid");

const utility = require("../../common/utility");
const {logger, customError} = utility;

async function signDisclaimer(input) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		disclaimerId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let manifest;
	try{
		manifest = await Manifest.findOne({bookingId: input.bookingId});
	}catch(error){
		logger.error("Manifest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Manifest Error" };
	}
	
	if(!manifest)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	let guestFound = false;
	manifest.guests.forEach(guest => {
		if (guest.disclaimerId === input.disclaimerId) {
			guest.signedDisclaimerTimeStamp = new Date();
			guestFound = true;
		}
	});

	if (!guestFound)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid disclaimerId" };

	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}
	
	return manifest;
}

async function sendDisclaimer(input, user) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		customerId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let manifest;
	try{
		manifest = await Manifest.findOne({bookingId: input.bookingId});
	}catch(error){
		logger.error("Manifest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Manifest Error" };
	}
	
	if(!manifest)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	
	//find guestItem from manifest.guests and update the discalimerId
	let guestFound = false;
	manifest.guests.forEach(guestItem => {
		if (guestItem.customerId === input.customerId) {
			guestItem.disclaimerId = uuid.v4();
			guestFound = true;
		}
	});

	if (!guestFound)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };

	//save manifest
	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}

	//find target guest from db
	let guest;
	try{
		guest = await guest.findOne({customerId: input.customerId});
	}catch(error){
		logger.error("guest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Guest Error" };
	}

	if(!guest)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };

	//send disclaimer communication to party
	const eventQueueName = "sendCommunicationToParty";
	const input = {
		partyId: guest.partyId,
		title: "Disclaimer",
		body: "Please follow this link to sign your disclaimer"
	}

	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("Failed to send disclaimer communication to guest, rollback disclaimerId");
		
		manifest.guests.forEach(guestItem => {
			if (guestItem.customerId === input.customerId) {
				delete(guestItem.disclaimerId);
			}
		});

		try{
			manifest = await manifest.save();
		}catch(error){
			logger.error("manifest.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		sendCommunicationToPartyMsg: input
	};
}

module.exports = {
	signDisclaimer,
	sendDisclaimer
}