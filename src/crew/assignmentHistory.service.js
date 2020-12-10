"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const AssignmentHistory = require("./assignmentHistory.model").AssignmentHistory;
const utility = require("../common/utility");
const crewService = require("./crew.service");

async function addAssignment(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi.string().required(),
		itemId: Joi.string().required(),
		assignmentType: Joi.string().valid("BOOKING").required(),
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find assignmentHistory
	let targetAssignmentHistroy;
	try {
		targetAssignmentHistroy = await AssignmentHistory.findOne({ crewId: input.crewId });
	} catch (err) {
		logger.error("AssignmentHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//can't find targetAssignmentHistory for this crewId. Call initAssignmentHistory 
	if (targetAssignmentHistroy == null) {
		//init assignment history for this crewId
		targetAssignmentHistory = new AssignmentHistory();
		targetAssignmentHistory.crewId = input.crewId;

		try {
			targetAssignmentHistory = await targetAssignmentHistory.save();
		} catch (err) {
			logger.error("assignmentHistory.save Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
	}

	//push new bookingAssignment into assignments
	if (targetAssignmentHistroy.assignments == null) {
		targetAssignmentHistroy.assignments = [];
	}

	let assignment = {
		itemId: input.itemId,
		assignmentType: input.assignmentType,
		startTime: utility.isoStrToDate(input.startTime, input.utcOffset),
		endTime: utility.isoStrToDate(input.endTime, input.utcOffset)
	}
	targetAssignmentHistroy.assignments.push(assignment);

	//save to db
	try {
		targetAssignmentHistroy = await targetAssignmentHistroy.save();
	} catch (err) {
		logger.error("targetAssignmentHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return outputObjMapper(targetAssignmentHistroy);
}

async function removeAssignment(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi.string().required(),
		assignmentType: Joi.string().valid("BOOKING").required(),
		itemId: Joi.string().required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check for valid crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//find assignmentHistory
	let targetAssignmentHistory;
	try {
		targetAssignmentHistory = await AssignmentHistory.findOne({ crewId: input.crewId });
	} catch (err) {
		logger.error("AssignmentHistory Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetAssignmentHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//check if assignment has any assignments
	if (targetAssignmentHistory.assignments == null || targetAssignmentHistory.assignments.length == 0) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "No assignments found" };
	}

	//remove assignment
	let targetAssignmentFound = false;
	targetAssignmentHistory.assignments.forEach(function (assignment, index, object) {
		if (assignment.itemId == input.itemId && assignment.assignmentType == input.assignmentType) {
			targetAssignmentFound = true;
			object.splice(index, 1);
		}
	});

	if (targetAssignmentFound == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "No assignments found" };
	}

	//save assignment record
	try {
		targetAssignmentHistory = await targetAssignmentHistory.save();
	} catch (err) {
		logger.error("targetAssignmentHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return outputObjMapper(targetAssignmentHistory);
}

async function initAssignmentHistory(input, user) {
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

	let targetCrew;
	try{
		targetCrew = await crewService.findCrew({crewId: input.crewId});
	}catch(error){
		logger.error("crewService.findCrew error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(targetCrew == null){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid crewId" };
	}

	//save assignamntHistory
	let assignmentHistory = new AssignmentHistory();
	assignmentHistory.crewId = targetCrew.id;

	try {
		assignmentHistory = await assignmentHistory.save();
	} catch (err) {
		logger.error("assignmentHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return outputObjMapper(assignmentHistory);
}

async function getAssignmentHistory(input, user) {
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

	let targetAssignmentHistory;
	try {
		targetAssignmentHistory = await AssignmentHistory.findOne({crewId : input.crewId});
	} catch (err) {
		logger.error("AssignmentHistory.findOnd Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetAssignmentHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	return outputObjMapper(targetAssignmentHistory);
}

async function deleteAssignmentHistory(input, user) {
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

	let targetAssignmentHistory;
	try {
		targetAssignmentHistory = await AssignmentHistory.findOne({ crewId: input.crewId });
	} catch (err) {
		logger.error("AssignmentHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetAssignmentHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//delete assignment record
	try {
		await AssignmentHistory.findByIdAndDelete(targetAssignmentHistory._id.toString());
	} catch (err) {
		logger.error("AssignmentHistory.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return {"status":"SUCCESS"}
}

function outputObjMapper(assignmentHistory){
	let outputObj = new Object();

	outputObj.crewId= assignmentHistory.crewId;

	if (assignmentHistory.assignments != null && assignmentHistory.assignments.length > 0) {
		outputObj.assignments = [];

		assignmentHistory.assignments.forEach(assignment => {
			outputObj.assignments.push({
				assignmentType: assignment.assignmentType,
				itemId: assignment.itemId,
				startTime: assignment.startTime,
				endTime: assignment.endTime,
			});
		});
	}

	return outputObj;
}

module.exports = {
	initAssignmentHistory,
	addAssignment,
	removeAssignment,
	getAssignmentHistory,
	deleteAssignmentHistory
	
}