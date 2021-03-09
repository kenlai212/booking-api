"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const { Manifest, Guest } = require("./manifest.model");

async function removeGuest(input, user) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		customerId: Joi.string().min(1).required()
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

	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}
	
	return manifest;
}

async function addGuest(input, user) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		customerId: Joi
			.string()
			.min(1)
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

	if (!manifest.guests)
		manifest.guests = [];

	let guest;
	try{
		guest = await Guest.findOne({customerId: input.customerId});
	}catch(error){
		logger.error("Guest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Guest Error" };
	}
	
	if(!guest)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };

	//check if guest already exist
	var foundExistingGuest = false;
	manifest.guests.forEach(guestItem => {
		if (guestItem.customerId === guest.customerId) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already in manifest" };

	//add guest to manifest
	let guestItem = {
		customerId: input.customerId,
		creationTime: new Date(),
		createdByParty: user.id,
	}
	manifest.guests.push(guestItem);

	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}

	return manifest;
}

async function newManifest(input, user){
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		guests: Joi
			.array()
			.items(Joi.string())
	});
	utility.validateInput(schema, input);

	input.guests.forEach(customerId => {
		let guest;
		try{
			guest = await Guest.findOne({customerId: customerId});
		}catch(error){
			logger.error("Guest.findOne : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Guest Error" };
		}

		if(!guest){
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };
		}
	})

	let manifest = new Manifest();

	manifest.bookingId = input.bookingId;

	manifest.guests = [];
	input.guests.forEach(customerId => {
		manifest.guests.push({
			customerId: customerId,
			creationTime: new Date(),
			createdByParty: user.id
		});
	});

	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}

	return manifest;
}

module.exports = {
	newManifest,
	addGuest,
	removeGuest
}