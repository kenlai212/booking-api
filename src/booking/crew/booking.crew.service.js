"use strict";
const Joi = require("joi");
const moment = require("moment");

const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;
const bookingCommon = require("../booking.common");
const assignmentHelper = require("./assignment_internal.helper");
const crewHelper = require("./crew_internal.helper");
const bookingHistoryHelper = require("../bookingHistory_internal.helper");

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

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get booking
	let targetBooking;
	try{
		targetBooking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

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

	//save booking
	try {
		targetBooking = await targetBooking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//remove assignment for crew's assignmentHistory
	try {
		await assignmentHelper.removeAssignment(input.crewId, targetBooking._id.toString(), user);
	} catch (err) {
		logger.error("assignmentHelper.removeAssignment Error : ", err);
		logger.error(`Crew(id : ${input.crewId}) was removed from booking(id : ${targetBooking._id.toString()}). But removeAssignment failed. Please remove assignment manually.`);
		//TODO roll back remove crew from booking

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: targetBooking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Relieved crew : ${input.crewId}`
	}
	
	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Relieved crew(${targetCrew.id}) from booking(${targetBooking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(targetBooking);
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

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get booking
	let targetBooking;
	try{
		targetBooking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

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
		name: targetCrew.name,
		contact: targetCrew.contact,
		picture: targetCrew.picture,
		assignmentTime: moment().toDate(),
		assignmentBy: user.id
	});

	try {
		targetBooking = await targetBooking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add assignment to crew
	const addAssignmentInput = {
		crewId: targetCrew.id,
		bookingId: targetBooking._id.toString(),
		startTime: targetBooking.startTime,
		endTime: targetBooking.endTime
	}

	try {
		await assignmentHelper.addAssignment(addAssignmentInput, user);
	} catch (err) {
		logger.error("assignmentHelper.addAssignmentItem Error : ", err);
		logger.error(`Crew(id : ${targetCrew.id}) has been assigned to booking(id : ${targetBooking._id.toString()}). But failed to addAssignment. Please manually trigger addAssignment ${addAssignmentInput}`);
	}
	
	//add history item
	const addBookingHistoryItemInput = {
		bookingId: targetBooking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Assigned new crew member : ${targetCrew.crewName}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Edit crew(${targetCrew.id}) to booking(${targetBooking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(targetBooking);
}

module.exports = {
	assignCrew,
	relieveCrew
}