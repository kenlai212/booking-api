"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const { Roster, CrewMember } = require("./roster.model");

async function newRoster(input, user){
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		crew: Joi
			.array()
			.items(Joi.string())
	});
	utility.validateInput(schema, input);

	input.crew.forEach(staffId => {
		let crewMember;
		try{
			crewMember = await CrewMember.findOne({customerId: staffId});
		}catch(error){
			logger.error("CrewMember.findOne : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find CrewMember Error" };
		}

		if(!crewMember){
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid staffId" };
		}
	})

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

async function relieveCrew(input, user) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		staffId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let roster;
	try{
		roster = await Roster.findOne({bookingId: input.bookingId});
	}catch(error){
		logger.error("Roster.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Roster Error" };
	}

	if(!roster)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId"};

	if (!roster.crew)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId"};

	
	let crewFound = false;
	roster.crew.forEach(function (crew, index, object) {
		if (crew.staffId === input.staffId) {
			crewFount = true;
			object.splice(index, 1);
		}
	});

	if (!crewFound)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };

	try{
		roster = await roster.save();
	}catch(error){
		logger.error("roster.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Roster Error" };
	}
	
	return roster;
}

async function assignCrew(input, user) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		staffId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let roster;
	try{
		roster = await Roster.findOne({bookingId: input.bookingId});
	}catch(error){
		logger.error("Roster.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Roster Error" };
	}

	if(!roster)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId"};

	let crewMember;
	try {
		crewMember = await CrewMember.findOne({staffId: staffId});
	} catch (error) {
		logger.error("CrewMember.findOne Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Crew Member Error" };
	}
	
	if (!crewMember)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId" };
	
    //check if targetCrew is already assigned to booking
    if(roster.crew && roster.crew.length > 0){
        roster.crew.forEach(crewMember => {
            if (crewMember.staffId === input.staffId) {
                throw { name: customError.BAD_REQUEST_ERROR, message: `Target crew already assigned to this roster` };
            }
        });
    }

	//hold oldCrew in memory, incase we need to roll back
	const oldCrew = {...roster.crew};

	//add crew
	if (!roster.crew)
		roster.crew = [];

	roster.crew.push({
		staffId: input.staffId,
		assignmentTime: new Date(),
		assignmentBy: user.id
	});

	try{
		roster = await roster.save();
	}catch(error){
		logger.error("roster.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Roster Error" };
	}

	const eventQueueName = "addCrew";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back assign crew");
		
		roster.crew = oldCrew;

		try{
			await roster.save();
		}catch(error){
			logger.error("roster.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Roolback Save Roster Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		addCrewEventMsg: input
	};
}

module.exports = {
	newRoster,
	assignCrew,
	relieveCrew
}