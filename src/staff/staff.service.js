"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const staffDao = require("./staff.dao");
const {Staff} = require("./staff.model");

async function newStaff(input){
    const schema = Joi.object({
		staffId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const existingStaff = await staffDao.find(input.staffId);
	if(existingStaff){
		logger.error(`Staff(${input.staffId}) already exist`);
		throw { name: customError.BAD_REQUEST_ERROR, message: `Staff(${input.staffId}) already exist` }
	}

	let staff = new Staff();
	staff._id = input.staffId;

	staff = await staffDao.save(staff);
	
	logger.info(`Added new Customer(customerId: ${staff.staffId})`);

    return staff; 
}

async function findStaff(input){
	const schema = Joi.object({
		staffId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const staff = await staffDao.find(input.staffId);

	if(!staff)
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid staffId" };

	return staff;
}

async function deleteStaff(input){
	const schema = Joi.object({
		staffId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

    await staffDao.del(input.staffId);

	logger.info(`Deleted staff(${input.staffId})`);

	return {status: "SUCCESS"}
}

async function deleteAllStaffs(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await staffDao.deleteAll();

	logger.info("Delete all staffs");

	return {status: "SUCCESS"}
}

module.exports = {
	newStaff,
	findStaff,
	deleteStaff,
	deleteAllStaffs
}