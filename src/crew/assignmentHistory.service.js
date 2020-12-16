"use strict";
const { util } = require("config");
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const AssignmentHistory = require("./assignmentHistory.model").AssignmentHistory;
const utility = require("../common/utility");

//private function
async function getAssignmentHistory(crewId){
	//check for valid crewId
	if (mongoose.Types.ObjectId.isValid(crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	let targetAssignmentHistory;
	try {
		targetAssignmentHistory = await AssignmentHistory.findOne({crewId : crewId});
	} catch (err) {
		logger.error("AssignmentHistory.findOnd Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetAssignmentHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	return targetAssignmentHistory;
}

//private function
async function saveAssignmentHistory(assignmentHistory){
	try {
		assignmentHistory = await assignmentHistory.save();
	} catch (err) {
		console.log(err);
		logger.error("targetAssignmentHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return outputObjMapper(assignmentHistory);
}

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
	utility.validateInput(schema, input);

	//find assignmentHistory
	let targetAssignmentHistroy;
	try {
		targetAssignmentHistroy = await getAssignmentHistory(input.crewId);
	} catch (err) {
		if(err.name == customError.RESOURCE_NOT_FOUND_ERROR){
			//can't find targetAssignmentHistory for this crewId. Call initAssignmentHistory

			//init assignment history for this crewId
			targetAssignmentHistory = new AssignmentHistory();
			targetAssignmentHistory.crewId = input.crewId;

			try {
				targetAssignmentHistory = await targetAssignmentHistory.save();
			} catch (err) {
				console.log(err);
				logger.error("assignmentHistory.save Error : ", err);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
		}else{
			//system error
			throw err;
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
	return await saveAssignmentHistory(targetAssignmentHistroy);
}

async function removeAssignment(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi.string().required(),
		assignmentType: Joi.string().valid("BOOKING").required(),
		itemId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	//get target assignmentHistory
	let targetAssignmentHistory = await getAssignmentHistory(input.crewId);

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

	//save to db
	return await saveAssignmentHistory(targetAssignmentHistroy);
}

async function initAssignmentHistory(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//check existing assignmentHistory
	let existingAssignmentHistory;

	try {
		existingAssignmentHistory = await AssignmentHistory.findOne({crewId : input.crewId});
	} catch (err) {
		logger.error("AssignmentHistory.findOnd Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if(existingAssignmentHistory!=null){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Assignment History already exist" };
	}

	//save assignamntHistory
	let assignmentHistory = new AssignmentHistory();
	assignmentHistory.crewId = input.crewId;

	//save to db
	return await saveAssignmentHistory(assignmentHistroy);
}

async function findAssignmentHistory(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//get target assignmentHistory
	let targetAssignmentHistory = await getAssignmentHistory(input.crewId);

	return outputObjMapper(targetAssignmentHistory);
}

async function deleteAssignmentHistory(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//check for valid crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//get target assignmentHistory
	let targetAssignmentHistory = await getAssignmentHistory(input.crewId);

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
	findAssignmentHistory,
	deleteAssignmentHistory
}