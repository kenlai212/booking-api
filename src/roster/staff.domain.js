"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const {logger, customError} = utility;

const { Staff } = require("./roster.model");

async function createStaff(input){
	const schema = Joi.object({
		staffId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let staff = new Staff();
        staff.staffId  = input.staffId;

    try{
        await staff.save();
    }catch(error){
    	logger.error("crewMember.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CrewMember Error" };
    }

	return staff;
}

async function readStaff(staffId){
    let staff;
	try{
		staff = await Staff.findOne({staffId: staffId});
	}catch(error){
		logger.error("Staff.findOne : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Staff Error" };
	}

	if(!staff){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid staffId" };
	}

    return staff;
}

async function updateStaff(staff){
	try{
        await staff.save();
    }catch(error){
    	logger.error("crewMember.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CrewMember Error" };
    }

	return staff;
}

module.exports = {
	createStaff,
	readStaff,
	updateStaff
}