"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Staff, StaffPerson } = require("./staff.model");
const staffHelper = require("./staff.helper");

async function newStaff(input, user) {
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.allow(null)
	});
	utility.validateInput(schema, input);

	//validate person
	let staffPerson;
	try{
		staffPerson = StaffPerson.findOne({personId: input.personId});
	}catch(error){
		logger.error("StaffPerson.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find StaffPerson Error" };
	}

	if(!staffPerson)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	//check if staff with the same personId already exist
	let existingStaff;
	try{
		existingStaff = await Staff.findOne({personId: staffPerson.personId});
	}catch(error){
		logger.error("Staff.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}

	if(existingStaff)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Staff already exist" };
	
	let staff = new Staff();
	staff.status = "ACTIVE";
	staff.personId = input.personId;
	
	return await staffHelper.saveStaff(staff);
}

async function deleteStaff(input, user) {
	const schema = Joi.object({
		staffId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	const targetStaff = await staffHelper.getTargetStaff(input.staffId);

	try {
		await Staff.findByIdAndDelete(targetStaff._id.toString());
	} catch (err) {
		logger.error("Staff.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Staff Error" };
	}

	return { "status": "SUCCESS" }
}

async function editStatus(input, user) {
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		status: Joi
			.string()
			.valid("ACTIVE","INACTIVE")
			.required()
	});
	utility.validateInput(schema, input);

	let targetStaff = await staffHelper.getTargetStaff(input.customerId);

	targetStaff.status = input.status;

	return await staffHelper.saveCustomer(targetStaff);
}

module.exports = {
	newStaff,
	deleteStaff,
	editStatus
}