"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Staff} = require("./staff.model");

async function createStaff(input) {
	const schema = Joi.object({
		personId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let staff = new Staff();
	staff.status = input.status;
	staff.personId = input.personId;
	
	try {
		staff = await staff.save();
	} catch (err) {
		logger.error("staff.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Staff Error" };
	}

	return staff;
}

async function readStaff(staffId){
	let staff;
	try{
		staff = await Staff.findById(staffId);
	}catch(error){
		logger.error("Staff.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}

	if(!staff)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId" };

	return staff;
}

async function readStaffByPersonId(personId){
	let staff;
	try{
		staff = await Staff.findOne({personId: personId});
	}catch(error){
		logger.error("Staff.findOne error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}

	return staff;	
}

async function deleteStaff(staffId) {
	try {
		await Staff.findByIdAndDelete(staffId);
	} catch (err) {
		logger.error("Staff.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Staff Error" };
	}

	return { "status": "SUCCESS" }
}

async function updateStaff(staff) {
	try {
		staff = await staff.save();
	} catch (err) {
		logger.error("staff.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Staff Error" };
	}

	return staff;
}

module.exports = {
	createStaff,
	readStaff,
	readStaffByPersonId,
	deleteStaff,
	updateStaff
}