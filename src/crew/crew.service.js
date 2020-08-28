"use strict";
const Joi = require("joi");
const winston = require("winston");
const mongoose = require("mongoose");

const gogowakeCommon = require("gogowake-common");
const customError = require("../errors/customError");
const Crew = require("./crew.model").Crew;

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";

async function findCrew(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP,
			OCCUPANCY_USER_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			crewId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//check for valid crewId
		if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
			reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" });
		}

		Crew.findById(input.crewId)
			.then(result => {
				if (result == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" });
				}

				var outputObj;
				if (result != null) {
					outputObj = crewToOutputObj(result);
				}

				resolve(outputObj);
			})
			.catch(err => {
				winston.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date: Jun 1, 2020
 */
async function searchCrews(user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		Crew.find()
			.then(crews => {
				var outputObjs = [];
				crews.forEach(crew => {
					outputObjs.push(crewToOutputObj(crew));
				});

				resolve({ "crews": outputObjs });
			})
			.catch(err => {
				winston.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

async function newCrew(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			crewName: Joi
				.string()
				.required(),
			telephoneCountryCode: Joi
				.string()
				.required(),
			telephoneNumber: Joi
				.string()
				.required(),
		});
		
		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		var crew = new Crew();
		crew.crewName = input.crewName;
		crew.createdBy = user.id;
		crew.createdTime = gogowakeCommon.getNowUTCTimeStamp();
		crew.telephoneCountryCode = input.telephoneCountryCode;
		crew.telephoneNumber = input.telephoneNumber;
		crew.history = [
			{
				transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
				transactionDescription: "New Crew Record",
				userId: user.id,
				userName: user.name
			}
		]

		//save to db
		crew.save()
			.then(crew => {
				var outputObj = crewToOutputObj(crew);
				resolve(outputObj);
			})
			.catch(err => {
				winston.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
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