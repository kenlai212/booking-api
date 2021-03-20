"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Staff, StaffPerson } = require("./staff.model");

async function findStaff(input) {
	const schema = Joi.object({
		id: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	if (!mongoose.Types.ObjectId.isValid(input.id))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid id" };

	let staff;

	//try to find targetStaff by id first
	try {
		staff = await Staff.findById(input.id);
	} catch (err) {
		logger.error("Staff.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}
	
	//if no targetStaff found, try to find by personId
	if(!staff){
		try {
			staff = await Staff.findOne({personId : input.id});
		} catch (err) {
			logger.error("Staff.findById Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
		}
	}

	if(!staff)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid id" };

	//find staffPerson
	let staffPerson;
	try{
		staffPerson = StaffPerson.findOne({personId: staff.personId});
	}catch(error){
		logger.error("StaffPerson.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find StaffPerson Error" };
	}

	return staffToOutputObj(staff, staffPerson);
}

async function searchStaffs(input) {
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

	let staffs;
	try {
		staffs = await Staff.find(searchCriteria);
	} catch (err) {
		logger.error("Staff.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	} 

	//set outputObjs
	var outputObjs = [];
	staffs.forEach((staff) => {
		let staffPerson;
		try{
			staffPerson = StaffPerson.findOne({personId: staff.personId});
		}catch(error){
			logger.error("StaffPerson.findOne Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find StaffPerson Error" };
		}

		outputObjs.push(staffToOutputObj(staff, stafPerson));
	});

	return {
		"count": outputObjs.length,
		"staffs": outputObjs
	};
}

function staffToOutputObj(staff, staffPerson) {
	var outputObj = new Object();
	outputObj.id = staff._id.toString();
	outputObj.status = staff.status;
	outputObj.partyId = staff.partyId;

	outputObj.personalInfo = staffPerson.personalInfo;

	if(staffPerson.contact.telephoneNumber != null || staffPerson.contact.emailAddress != null){
		outputObj.contact = staffPerson.contact;
	}
	
	if(staffPerson.picture.url != null){
		outputObj.picture = staffPerson.picture;
	}

	return outputObj;
}

module.exports = {
	searchStaffs,
	findStaff
}