"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Manifest} = require("./manifest.model");

async function createManifest(input, user){
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		guests: Joi
			.array()
			.items(Joi.string())
	});
	utility.validateInput(schema, input);

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

async function readManifest(bookingId){
	let manifest;
	try{
		manifest = await Manifest.findOne({bookingId: bookingId});
	}catch(error){
		logger.error("Manifest.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Manifest Error" };
	}
	
	if(!manifest)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return manifest;
}

async function updateManifest(manifest){
	try{
		manifest = await manifest.save();
	}catch(error){
		logger.error("manifest.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Manifest Error" };
	}

	return manifest;
}

module.exports = {
	createManifest,
	readManifest,
	updateManifest
}