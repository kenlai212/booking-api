"use strict";
const Joi = require("joi");
const { v4: uuidv4 } = require('uuid');

const lipslideCommon = require("lipslide-common");
const {customError} = lipslideCommon;

const utility = require("../utility");
const { Staff } = require("./staff.model");

function validateNewStaffInput(input){
	utility.validateInput(Joi.object({
        staffId: Joi.string().required(),
        status: Joi.string().required(),
		name: Joi.string().required(),
        countryCode: Joi.string().required(),
		phoneNumber: Joi.string().required()
	}), input);
}

function initStaff(input){
    let staff = new Staff();

    staff._id = input.staffId;
    staff.status = input.status;
    staff.name = input.name;
    staff.countryCode = input.countryCode;
    staff.phoneNumber = input.phoneNumber;

    return staff;
}

function validateFindStaffInput(input){
    utility.validateInput(Joi.object({
        staffId: Joi.string()
	}), input);
}

module.exports = {
    validateNewStaffInput,
    initStaff,
    validateFindStaffInput
}