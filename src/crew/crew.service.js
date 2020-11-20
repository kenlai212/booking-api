"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const Crew = require("./crew.model").Crew;

const CREW_ADMIN_GROUP = "CREW_ADMIN";
const CREW_USER_GROUP = "CREW_USER";

async function findCrew(input, user) {
	const rightsGroup = [
		CREW_ADMIN_GROUP,
		CREW_USER_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

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

	let crew;
	try {
		crew = await Crew.findById(input.crewId);
	} catch (err) {
		logger.error("Crew.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (crew == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	return crewToOutputObj(crew);
}

async function searchCrews(input, user) {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]
	
	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	let crews;
	try {
		crews = await Crew.find();
	} catch (err) {
		logger.error("Crew.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	crews.forEach((item) => {
		outputObjs.push(crewToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"crews": outputObjs
	};
}

async function newCrew(input, user) {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		crewName: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86")
			.required(),
		telephoneNumber: Joi
			.string()
			.required(),
		emailAddress: Joi
			.string()
			.min(1)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let crew = new Crew();
	crew.status = "ACTIVE";
	crew.crewName = input.crewName;
	crew.createdBy = user.id;
	crew.createdTime = moment().toDate();

	crew.telephoneCountryCode = input.telephoneCountryCode;
	crew.telephoneNumber = input.telephoneNumber;
	if (input.emailAddress != null) {
		crew.emailAddress = input.emailAddress;
	}
	
	crew.history = [
		{
			transactionTime: moment().toDate(),
			transactionDescription: "New Crew Record",
			userId: user.id,
			userName: user.name
		}
	]

	//save to db
	try {
		crew = await crew.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return crewToOutputObj(crew);
}

async function deleteCrew(input, user) {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required()
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//get target crew
	let targetCrew;
	try {
		targetCrew = await Crew.findById(input.crewId);
	} catch (err) {
		logger.error("Crew.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetCrew == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid crewId" };
	}
	
	try {
		await Crew.findByIdAndDelete(targetCrew._id.toString());
	} catch (err) {
		logger.error("Crew.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return { "status": "SUCCESS" }
}

async function editStatus(input, user) {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required(),
		status: Joi
			.string()
			.valid("ACTIVE","INACTIVE")
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//get target crew
	let targetCrew;
	try {
		targetCrew = await Crew.findById(input.crewId);
	} catch (err) {
		logger.error("Crew.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetCrew == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid crewId" };
	}

	//update status
	targetCrew.status = input.status;

	const historyItem = {
		transactionTime: moment().toDate(),
		transactionDescription: `Updated status : ${input.status}`,
		userId: user.id,
		userName: user.name
	}
	targetCrew.history.push(historyItem);

	try {
		targetCrew = await targetCrew.save();
	} catch (err) {
		logger.error("targetCrew.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetCrew;
}

function crewToOutputObj(crew) {
	var outputObj = new Object();
	outputObj.crewId = crew._id;
	outputObj.status = crew.status;
	outputObj.crewName = crew.crewName;
	outputObj.telephoneCountryCode = crew.telephoneCountryCode;
	outputObj.telephoneNumber = crew.telephoneNumber;
	if (crew.emailAddress != null) {
		outputObj.emailAddress;
	}

	return outputObj;
}

module.exports = {
	searchCrews,
	newCrew,
	findCrew,
	deleteCrew,
	editStatus
}