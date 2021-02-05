"use strict";
const Joi = require("joi");
const moment = require("moment");

const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;
const bookingCommon = require("../booking.common");
const utility = require("../../common/utility");

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
	if (!targetBooking.crews)
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId"};

	//find and remove target crew
	let targetCrew;
	targetBooking.crews.forEach(function (crew, index, object) {
		if (crew.crewId == input.crewId) {
			targetCrew = crew;
			object.splice(index, 1);
		}
	});

	//target crew not found
	if (!targetCrew)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(targetBooking);

	//publish relieveCrew event
	const relieveCrewEventMsg = {
		crewId: input.crewId,
		bookingId: targetBooking._id.toString()
	}
	
	try{
		utility.publishEvent(relieveCrewEventMsg, "relieveCrew");
	}catch(error){
		console.log(error);
		logger.err("utility.publishEvent error : ", error);

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

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
	
	if (!targetCrew)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	
    //check if targetCrew is already assigned to booking
    if(targetBooking.crews && targetBooking.crews.length > 0){
        targetBooking.crews.forEach(crew => {
            if (crew._id === targetCrew.id) {
                throw { name: customError.BAD_REQUEST_ERROR, message: `Target crew already assigned to this booking` };
            }
        });
    }

	//add crew
	if (!targetBooking.crews)
		targetBooking.crews = new Array();

	targetBooking.crews.push({
		_id: targetCrew.id,
		assignmentTime: moment().toDate(),
		assignmentBy: user.id
	});

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(targetBooking);
	
	//publish assignCrew event
	const assignCrewEventMsg = {
		crewId: targetCrew.id,
		bookingId: targetBooking._id.toString()
	}
	
	try{
		utility.publishEvent(assignCrewEventMsg, "assignCrew");
	}catch(error){
		console.log(error);
		logger.err("utility.publishEvent error : ", error);

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingOutput;
}

module.exports = {
	assignCrew,
	relieveCrew
}