"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const Crew = require("./crew.model").Crew;

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";

async function findCrew(input, user) {
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_USER_GROUP
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

/**
 * By : Ken Lai
 * Date: Jun 1, 2020
 */
async function searchCrews(input, user) {
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP
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

	return { "crews": outputObjs };
}

async function newCrew(input, user) {
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP
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
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	var crew = new Crew();
	crew.crewName = input.crewName;
	crew.createdBy = user.id;
	crew.createdTime = moment().toDate();
	crew.telephoneCountryCode = input.telephoneCountryCode;
	crew.telephoneNumber = input.telephoneNumber;
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

function crewToOutputObj(crew) {
	var outputObj = new Object();
	outputObj.id = crew._id;
	outputObj.crewName = crew.crewName;
	outputObj.telephoneCountryCode = crew.telephoneCountryCode;
	outputObj.telephoneNumber = crew.telephoneNumber;

	return outputObj;
}

module.exports = {
	searchCrews,
	newCrew,
	findCrew
}