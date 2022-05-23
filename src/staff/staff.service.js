"use strict";
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {DBError} = lipslideCommon;

const utility = require("../utility");
const helper = require("./staff.helper");
const { Staff } = require("./staff.model");

async function newStaff(input) {
	helper.validateNewStaffInput(input);

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	let staff = helper.initStaff(input);

	try{
		staff = await staff.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}

	return staff;
}

async function findStaff(input){
	helper.validateFindStaffInput(input);

	let staff;

	if(input.staffId){
		try{
			staff = await Staff.findById(input.staffId);
		}catch(error){
			throw new DBError(error);
		}
	}else if(input.referenceId){
		try{
			staff = await Staff.findOne({referenceId: input.referenceId});
		}catch(error){
			throw new DBError(error);
		}
	}

	return staff;
}

module.exports = {
	newStaff,
	findStaff
}