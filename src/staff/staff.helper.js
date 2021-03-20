"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Staff} = require("./staff.model");

async function getTargetStaff(staffId){
	if (!mongoose.Types.ObjectId.isValid(staffId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId" };

	let staff;
	try {
		staff = await Staff.findById(staffId);
	} catch (err) {
		logger.error("Staff.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}
	
	if (!staff)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid staffId" };

	return staff;
}

async function saveStaff(staff){
	try {
		staff = await staff.save();
	} catch (err) {
		logger.error("staff.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Staff Error" };
	}

	return staff;
}

module.exports = {
	getTargetStaff,
    saveStaff
}