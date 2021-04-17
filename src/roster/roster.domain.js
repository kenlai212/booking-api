"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const { Roster } = require("./roster.model");

async function createRoster(input){
    const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		crew: Joi
			.array()
			.items(Joi.string())
	});
	utility.validateInput(schema, input);

	let roster = new Roster();

	roster.bookingId = input.bookingId;

	roster.crew = [];
	input.crew.forEach(staffId => {
		roster.crew.push({
			staffId: staffId,
			assignmentTime: new Date(),
			assignByParty: user.id
		});
	});

	try{
		roster = await roster.save();
	}catch(error){
		logger.error("roster.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Roster Error" };
	}

	return roster;
}

async function readRoster(bookingId){
    let roster;
	try{
		roster = await Roster.findOne({bookingId: bookingId});
	}catch(error){
		logger.error("Roster.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Roster Error" };
	}

	if(!roster)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId"};

    return roster;
}

async function updateRoster(roster){
    try{
		roster = await roster.save();
	}catch(error){
		logger.error("roster.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Roster Error" };
	}
	
	return roster;
}

module.exports = {
	createRoster,
    readRoster,
    updateRoster
}