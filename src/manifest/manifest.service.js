"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const manifestDomain = require("./manifest.domain");
const customerDomain = require("./customer.domain");

async function newManifest(input){
	const schema = Joi.object({
		bookingId: Joi.string().required(),
		guests: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

	let createManifestInput = new Object();
	createManifestInput.bookingId = input.bookingId;

	if(input.guests){
		createManifestInput.guests = [];

		input.guests.forEach(async customerId => {
			try{
				await customerDomain.readCustomer(customerId);
			}catch(error){
				utility.logger.info(error);
			}
		});
	}

	return await manifestDomain.createManifest(createManifestInput);
}

async function removeGuest(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		customerId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let manifest = manifestDomain.readManifest(input.bookingId);

	//remove guest from manifest.guests
	let guestFound = false;
	if (manifest.guests && manifest.guests.length > 0) {
		manifest.guests.forEach((guest, index, object) => {
			if (guest.customerId === input.customerId) {
				guestFound = true;
				object.splice(index, 1);
			}
		});
	}
	
	if (!guestFound)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Guest not found" };
	
	return await manifestDomain.updateManifest(manifest);
}

async function addGuest(input) {
	const schema = Joi.object({
		bookingId: Joi.string().required(),
		customerId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let manifest = await manifestDomain.readManifest(input.bookingId);

	if (!manifest.guests)
		manifest.guests = [];

	let customer = customerDomain.readCustomer(input.customerId);

	//check if guest already exist
	var foundExistingGuest = false;
	manifest.guests.forEach(guestItem => {
		if (guestItem.customerId === customer.customerId) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already in manifest" };

	//add guest to manifest
	let guestItem = {
		customerId: input.customerId,
		creationTime: new Date()
	}
	manifest.guests.push(guestItem);

	return await manifestDomain.updateManifest(manifest);
}

module.exports = {
	newManifest,
	addGuest,
	removeGuest
}