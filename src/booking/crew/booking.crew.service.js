"use strict";
const mongoose = require("mongoose");
const Joi = require("joi");
const moment = require("moment");

const customError = require("../../common/customError");
const userAuthorization = require("../../common/middleware/userAuthorization");
const logger = require("../../common/logger").logger;
const Booking = require("../booking.model").Booking;
const crewHelper = require("../crew_internal.helper");
const bookingCommon = require("../booking.common");
const assignmentHelper = require("./assignment_internal.helper");

async function relieveCrew(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

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

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let targetBooking;
	try {
		targetBooking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (targetBooking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//if booking doesn't contain any crew, it's a bad crewId
	if (targetBooking.crews == null) {
		throw {name: customerError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId"};
	}

	//find and remove target crew
	let targetCrewFound = false;
	targetBooking.crews.forEach(function (crew, index, object) {
		if (crew.crewId == input.crewId) {
			object.splice(index, 1);
			targetCrewFound = true;
		}
	});

	//target crew not found
	if (targetCrewFound == false) {
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

	//add transaction history
	try {
		await bookingCommon.addBookingHistoryItem(targetBooking._id.toString(), `"Relieved crew : ${input.crewId}`, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Crew(id : ${input.crewId}) was removed from booking(id : ${targetBooking._id.toString()}). But addBookingHistoryItem failed.`);
	}

	return bookingCommon.bookingToOutputObj(targetBooking);
}

async function assignCrew(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

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

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find target booking
	let targetBooking;
	try {
		targetBooking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (targetBooking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
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

	if (targetBooking.crews == null) {
		targetBooking.crews = new Array();
	}
	
	//check if targetCrew is already assigned to targetBooking
	targetBooking.crews.forEach(crew => {
		if (crew.crewId == targetCrew.crewId) {
			throw { name: customError.BAD_REQUEST_ERROR, message: `Target crew already assigned to this booking` };
		}
	});

	//add crew
	targetBooking.crews.push({
		crewId: targetCrew.crewId,
		crewName: targetCrew.crewName,
		telephoneCountryCode: targetCrew.telephoneCountryCode,
		telephoneNumber: targetCrew.telephoneNumber,
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
	try {
		assignmentHelper.addAssignment(targetCrew.crewId, targetBooking._id.toString(), targetBooking.startTime, targetBooking.endTime, user);
	} catch (err) {
		logger.error("assignmentHelper.addAssignmentItem Error : ", err);
		logger.error(`Crew(id : ${targetCrrew.crewId}) has been assigned to booking(id : ${targetBooking._id.toString()}). But failed to addAssignment. Either rollback the crew on booking record, or manually trigger addAssignment`);
		//TODO roll back assigned crew on targetBooking

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save bookingHistory
	try {
		await bookingCommon.addBookingHistoryItem(targetBooking._id.toString(), `Assigned new crew member : ${targetCrew.crewName}`, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Crew(id : ${targetCrrew.crewId}) has been assigned to booking(id : ${targetBooking._id.toString()}). But failed to addBookingHistoryItem`);
	}

	return bookingCommon.bookingToOutputObj(targetBooking);
}

module.exports = {
	assignCrew,
	relieveCrew
}