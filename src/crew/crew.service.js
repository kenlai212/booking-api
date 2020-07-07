"use strict";
const mongoose = require("mongoose");
const common = require("gogowake-common");
const logger = common.logger;
const Crew = require("./crew.model").Crew;

require('dotenv').config();

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";

async function findCrew(input, user) {
	var response = new Object;
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_USER_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	if (input.crewId == null || input.crewId.length < 1) {
		response.status = 400;
		response.message = "crewId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		response.status = 400;
		response.message = "Invalid crewId";
		throw response;
	}

	var crew;
	await Crew.findById(input.crewId)
		.then(result => {
			crew = result;
		})
		.catch(err => {
			logger.error("Crew.findById() error : " + err);
			response.status = 500;
			response.message = "Crew.findById() is not available";
			throw response;
		});

	var outputObj;
	if (crew != null) {
		outputObj = crewToOutputObj(crew);
	}

	return outputObj;
}

/**
 * By : Ken Lai
 * Date: Jun 1, 2020
 */
async function searchCrews(user) {
	var response = new Object;
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	var crews = [];
	await Crew.find()
		.then(result => {
			crews = result;
		})
		.catch(err => {
			logger.error("Crew.find() error : " + err);
			response.status = 500;
			response.message = "Crew.find() is not available";
			throw response;
		});

	var outputObjs = [];
	crews.forEach(crew => {
		outputObjs.push(crewToOutputObj(crew));
	});

	return { "crews" : outputObjs };
}

async function newCrew(input, user) {
	var response = new Object;
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate crewName
	if (input.crewName == null || input.crewName.length < 1) {
		response.status = 400;
		response.message = "crewName is mandatory";
		throw response;
	}

	//validate telephoneCountryCode
	if (input.telephoneCountryCode == null || input.telephoneCountryCode.length < 1) {
		response.status = 400;
		response.message = "telephoneCountryCode is mandatory";
		throw response;
	}

	//validate telephoneNumber
	if (input.telephoneNumber == null || input.telephoneNumber.length < 1) {
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}

	var crew = new Crew();
	crew.crewName = input.crewName;
	crew.createdBy = user.id;
	crew.createdTime = common.getNowUTCTimeStamp();
	crew.telephoneCountryCode = input.telephoneCountryCode;
	crew.telephoneNumber = input.telephoneNumber;
	crew.history = [
		{
			transactionTime: common.getNowUTCTimeStamp(),
			transactionDescription: "New Crew Record",
			userId: user.id,
			userName: user.name
		}
	]

	//save to db
	await crew.save()
		.then(result => {
			crew = result;
		})
		.catch(err => {
			logger.error("crew.save() error : " + err);
			response.status = 500;
			response.message = "crew.save() not available";
			throw response;
		});

	var outputObj = crewToOutputObj(crew);
	return outputObj;
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