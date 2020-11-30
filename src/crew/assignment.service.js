"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Assignment = require("./assignment.model").Assignment;
const utility = require("../common/utility");

async function addAssignmentItem(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi.string().required(),
		bookingId: Joi.string().required(),
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check for valid bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//check for valid crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//find assignment
	let assignment;
	try {
		assignment = await Assignment.findOne({ crewId: input.crewId });
	} catch (err) {
		logger.error("Assignment.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (assignment == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//push new booking to bookings
	if (assignment.bookings == null) {
		assignment.bookings = [];
	}

	let booking = {
		bookingId: input.bookingId,
		startTime: utility.isoStrToDate(input.startTime, input.utcOffset),
		endTime: utility.isoStrToDate(input.endTime, input.utcOffset)
	}
	assignment.bookings.push(booking);

	//save to db
	try {
		assignment = await assignment.save();
	} catch (err) {
		logger.error("assignment.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return assignment;
}

async function initAssignment(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check for valid crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	let assignment = new Assignment();
	assignment.crewId = input.crewId;

	try {
		assignment = await assignment.save();
	} catch (err) {
		logger.error("assignment.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return assignment;
}

module.exports = {
	initAssignment,
	addAssignmentItem
}