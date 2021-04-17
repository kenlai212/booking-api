"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const rosterDomain = require("./roster.domain");
const staffDomain = require("./staff.domain");

const ASSIGN_CREW_QUEUE_NAME = "ASSIGN_CREW";
const RELEAVE_CREW_QUEUE_NAME = "RELEAVE_CREW";

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
		await staffDomain.readStaff(staffId);
	})

	let createRosterInput;
	createRosterInput.bookingId = input.bookingId;

	createRosterInput.crew = [];
	input.crew.forEach(staffId => {
		roster.crew.push({
			staffId: staffId,
			assignmentTime: new Date(),
			assignByParty: user.id
		});
	});

	return rosterDomain.createRoster(createRosterInput);
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

	let roster = rosterDomain.readRoster(input.bookingId);

	if (!roster.crew)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId"};

	//get oldCrew incase we need to row back
	const oldCrew = {...roster.crew}

	//splice staffId from crew array
	let crewFound = false;
	roster.crew.forEach(function (crew, index, object) {
		if (crew.staffId === input.staffId) {
			crewFount = true;
			object.splice(index, 1);
		}
	});

	if (!crewFound)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	
	//save to db
	roster = await rosterDomain.updateRoster(roster);

	//publish event
	await utility.publishEvent(input, RELEAVE_CREW_QUEUE_NAME, user, async () => {
		logger.error("rolling releave assign crew");
		
		roster.crew = oldCrew;

		await rosterDomain.updateRoster(roster);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${RELEAVE_CREW_QUEUE_NAME} queue`, 
		eventMsg: input
	};
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

	let roster = await rosterDomain.readRoster(input.bookingId);

	let staff = await staffDomain.readStaff(input.staffId);
	
    //check if targetCrew is already assigned to booking
    if(roster.crew && roster.crew.length > 0){
        roster.crew.forEach(crewMember => {
            if (crewMember.staffId === staff.staffId) {
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
		staffId: staff.staffId,
		assignmentTime: new Date(),
		assignmentBy: user.id
	});

	//save to db
	roster = await rosterDomain.updateRoster(roster);

	//publish event
	await utility.publishEvent(input, ASSIGN_CREW_QUEUE_NAME, user, async () => {
		logger.error("rolling back assign crew");
		
		roster.crew = oldCrew;

		await rosterDomain.updateRoster(roster);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${ASSIGN_CREW_QUEUE_NAME} queue`, 
		eventMsg: input
	};
}

module.exports = {
	newRoster,
	assignCrew,
	relieveCrew
}