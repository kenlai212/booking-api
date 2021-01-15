"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");
const { Crew } = require("./crew.model");
const assignmentHistoryService = require("./assignmentHistory.service");
const partyHelper = require("./party_internal.helper");
const profileHelper = require("../common/profile/profile.helper");

//private function
async function getTargetCrew(crewId){
	//validate crewId
	if (mongoose.Types.ObjectId.isValid(crewId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	let crew;
	try {
		crew = await Crew.findById(crewId);
	} catch (err) {
		logger.error("Crew.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (crew == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	return crew;
}

//private function
async function saveCrew(crew){
	//save to db
	try {
		crew = await crew.save();
	} catch (err) {
		logger.error("crew.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return crewToOutputObj(crew);
}

async function findCrew(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//check for valid crewId
	const targetCrew = await getTargetCrew(input.crewId);

	return crewToOutputObj(targetCrew);
}

async function searchCrews(input, user) {
	//validate input data
	const schema = Joi.object({
		status: Joi
			.string()
			.valid("ACTIVE", "INACTIVE", null)
	});
	utility.validateInput(schema, input);

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
	utility.validateInput(schema, input);

	//get party
	let targetParty = await partyHelper.getParty(input.partyId, user);

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
	crew.personalInfo = targetParty.personalInfo;

	if(targetParty.contact != null){
		crew.contact = targetParty.contact;
	}
	
	if(targetParty.picture != null){
		crew.picture = targetParty.picture;
	}
	
	//save to db
	const crewOutput = await saveCrew(crew);

	//init assignment
	try {
		const initInput = { "crewId": crewOutput.id }

		await assignmentHistoryService.initAssignmentHistory(initInput, user);
	} catch (err) {
		console.log(err);
		logger.error("assignmentService.initAssignmentHistory Error : ", err);
		logger.error(`Crew record (id : ${crewOutput.id}) has been created, but initAssignmentHistory failed... Please manually trigger initAssignmentHistory from API`);
	}

	return crewOutput;
}

async function deleteCrew(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	//get target crew
	const targetCrew = await getTargetCrew(input.crewId);

	//delete crew record
	try {
		await Crew.findByIdAndDelete(targetCrew._id.toString());
	} catch (err) {
		console.log(err);
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
	utility.validateInput(schema, input);

	//get target crew
	let targetCrew = await getTargetCrew(input.crewId);

	//update status
	targetCrew.status = input.status;

	return await saveCrew(targetCrew);
}

async function editPersonalInfo(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate personalInfo input
	input.personalInfo.nameRequired = false;
	profileHelper.validatePersonalInfoInput(input.personalInfo);

	//get target crew
	let targetCrew = await getTargetCrew(input.crewId);
	
	//set personalInfo attributes
	targetCrew = profileHelper.setPersonalInfo(input.personalInfo, targetCrew);

	//save record
	return await saveCrew(targetCrew);
}

async function editContact(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required(),
		contact: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate contact input
	profileHelper.validateContactInput(input.contact);

	//get target crew
	let targetCrew = await getTargetCrew(input.crewId);

	//set contact attributes
	targetCrew = profileHelper.setContact(input.contact, targetCrew);

	//save record
	return await saveCrew(targetCrew);
}

async function editPicture(input, user) {
	//validate input data
	const schema = Joi.object({
		crewId: Joi
			.string()
			.min(1)
			.required(),
		picture: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate picture input
	profileHelper.validatePictureInput(input.picture);

	//get target crew
	let targetCrew = await getTargetCrew(input.crewId);

	//set pictuer attributes
	targetCrew = profileHelper.setPicture(input.picture, targetCrew);

	//save record
	return await saveCrew(targetCrew);
}

function crewToOutputObj(crew) {
	var outputObj = new Object();
	outputObj.id = crew._id.toString();
	outputObj.status = crew.status;
	outputObj.partyId = crew.partyId;

	outputObj.personalInfo = crew.personalInfo;

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
	editPersonalInfo,
	editContact,
	editPicture
}