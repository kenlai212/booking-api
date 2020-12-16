"use strict";
const Joi = require("joi");
const moment = require("moment");

const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;
const bookingCommon = require("../booking.common");
const utility = require("../../common/utility");

const assignmentHelper = require("./assignment_internal.helper");
const crewHelper = require("./crew_internal.helper");

async function relieveCrew(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//get booking
	let targetBooking = await bookingCommon.getBooking(input.bookingId);

	//if booking doesn't contain any crew, it's a bad crewId
	if (targetBooking.crews == null) {
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId"};
	}

	//find and remove target crew
	let targetCrew;
	targetBooking.crews.forEach(function (crew, index, object) {
		if (crew.crewId == input.crewId) {
			targetCrew= crew;
			object.splice(index, 1);
		}
	});

	//target crew not found
	if (targetCrew == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(targetBooking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Relieved crew(${targetCrew.id}) from booking(${targetBooking._id.toString()})`, user);

	//remove assignment for crew's assignmentHistory
	const removeAssignmentInput = {
		crewId: input.crewId,
		bookingId: targetBooking._id.toString()
	}

	assignmentHelper.removeAssignment(removeAssignmentInput, user)
	.catch(() => {
		logger.error(`Crew(id : ${input.crewId}) was removed from booking(id : ${targetBooking._id.toString()}). But removeAssignment failed. Please remove assignment manually.`);
	});

	return bookingOutput;
}

async function assignCrew(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//get booking
	let targetBooking = await bookingCommon.getBooking(input.bookingId);

	//find target crew
	let targetCrew;
	try {
		targetCrew = await crewHelper.getCrew(input.crewId);
	} catch (err) {
		logger.error("crewHelper.getCrew Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (targetCrew == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}
	
    //check if targetCrew is already assigned to booking
    if(targetBooking.crews != null && targetBooking.crews.length > 0){
        targetBooking.crews.forEach(crew => {
            if (crew.crewId == targetCrew.id) {
                throw { name: customError.BAD_REQUEST_ERROR, message: `Target crew already assigned to this booking` };
            }
        });
    }

	//add crew
	if (targetBooking.crews == null) {
		targetBooking.crews = new Array();
	}

	targetBooking.crews.push({
		crewId: targetCrew.id,
		personalInfo: targetCrew.personalInfo,
		contact: targetCrew.contact,
		picture: targetCrew.picture,
		assignmentTime: moment().toDate(),
		assignmentBy: user.id
	});

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(targetBooking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Assigned crew(${JSON.stringify(targetCrew)}) to booking(${targetBooking._id.toString()})`, user);

	//add assignment to crew
	const addAssignmentInput = {
		crewId: targetCrew.id,
		bookingId: targetBooking._id.toString(),
		startTime: targetBooking.startTime,
		endTime: targetBooking.endTime
	}

	assignmentHelper.addAssignment(addAssignmentInput, user)
	.catch(() => {
		logger.error(`Crew(id : ${targetCrew.id}) has been assigned to booking(id : ${targetBooking._id.toString()}). But failed to addAssignment. Please manually trigger addAssignment ${addAssignmentInput}`);
	});
	
	return bookingOutput;
}

module.exports = {
	assignCrew,
	relieveCrew
}