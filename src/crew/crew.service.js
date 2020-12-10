"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Crew = require("./crew.model").Crew;
const assignmentHistoryService = require("./assignmentHistory.service");
const partyHelper = require("./party_internal.helper");
const profileHelper = require("../common/profile/profile.helper");

async function findCrew(input, user) {
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
	//validate input data
	const schema = Joi.object({
		status: Joi
			.string()
			.valid("ACTIVE", "INACTIVE", null)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let searchCriteria;
	if (input.status != null) {
		searchCriteria = {
			"status": input.status
		}
	}

	let crews;
	try {
		crews = await Crew.find(searchCriteria);
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
	//validate input data
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get party
	let targetParty
	try{
		targetParty = await partyHelper.getParty(input.partyId);
	}catch(error){
		logger.error("partyHelper.getParty error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(targetParty == null){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//check if crew with the same partyId already exist
	let existingCrew;
	try{
		existingCrew = await Crew.findOne({partyId: targetParty.id});
	}catch(error){
		logger.error("Crew.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(existingCrew != null){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Crew already exist" };
	}

	let crew = new Crew();
	crew.status = "ACTIVE";
	crew.partyId = targetParty.id;
	crew.name = targetParty.name;
	crew.contact = targetParty.contact;
	crew.picture = targetParty.picture;
	
	//save to db
	try {
		crew = await crew.save();
	} catch (err) {
		logger.error("crew.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init assignment
	try {
		await assignmentHistoryService.initAssignmentHistory({ crewId: crew._id.toString() }, user);
	} catch (err) {
		logger.error("assignmentService.initAssignment Error : ", err);
		logger.error(`Crew record (id : ${crew._id.toString()}) has been created, but initAssignmentHistory failed... Please handle manually. Either roll back the crew recoard or manually trigger initAssignmentHistory from API`);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return crewToOutputObj(crew);
}

async function deleteCrew(input, user) {
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
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid crewId" };
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

	//delete crew record
	try {
		await Crew.findByIdAndDelete(targetCrew._id.toString());
	} catch (err) {
		logger.error("Crew.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//delete assignment record
	try {
		await assignmentHistoryService.deleteAssignmentHistory({ crewId: targetCrew._id.toString() }, user);
	} catch (err) {
		logger.error("assignmentService.deleteAssignmentHistory() error : ", err);
		logger.error(`Crew record was deleted (id : ${targetCrew._id.toString()}), but deleteAssignmentHistory failed. Please delete manually`);
	}

	return { "status": "SUCCESS" }
}

async function editStatus(input, user) {
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

	try {
		targetCrew = await targetCrew.save();
	} catch (err) {
		logger.error("targetCrew.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return crewToOutputObj(targetCrew);
}

async function editProfile(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required(),
		profile: Joi
			.object()
			.required()
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate profile input
	try{
		profileHelper.validateProfileInput(input.profile, false);
	}catch(error){
		throw { name: customError.BAD_REQUEST_ERROR, message: error };
	}

	//validate crewId
	if (mongoose.Types.ObjectId.isValid(input.crewId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid crewId" };
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

	//set profile attributes
	targetCrew = profileHelper.setProfile(input.profile, targetCrew);

	//save record
	try {
		targetCrew = await targetCrew.save();
	} catch (err) {
		logger.error("targetCrew.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	return crewToOutputObj(targetCrew);
}

function crewToOutputObj(crew) {
	var outputObj = new Object();
	outputObj.id = crew._id.toString();
	outputObj.status = crew.status;
	outputObj.name = crew.name;

	if(crew.contact.telephoneNumber != null || crew.contact.emailAddress != null){
		outputObj.contact = crew.contact;
	}
	
	if(crew.picture.url != null){
		outputObj.picture = crew.picture;
	}

	return outputObj;
}

module.exports = {
	searchCrews,
	newCrew,
	findCrew,
	deleteCrew,
	editStatus,
	editProfile
}