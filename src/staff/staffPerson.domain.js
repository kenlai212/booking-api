"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { StaffPerson } = require("./staff.model");

async function createStaffPerson(input){
    const schema = Joi.object({
		personId: Joi.string().min(1).required(),
        name: Joi.string().required(),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
        profilePictureUrl: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);

    let staffPerson = new StaffPerson();
    staffPerson.personId = input.personId;
    staffPerson.name = input.name;

    if(input.phoneNumber){
        customerHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
        staffPerson.countryCode(input.countryCode);
        staffPerson.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress){
        customerHelper.validateEmailAddress(input.emailAddress);
        staffPerson.emailAddress = input.emailAddress;
    }

    if(input.profilePictureUrl)
        staffPerson.profilePictureUrl = input.profilePictureUrl;
        

    try{
        staffPerson = await staffPerson.save();
    }catch(error){
        logger.error("staffPerson.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save StaffPerson Error" };
    }

    return staffPerson;
}

module.exports = {
    createStaffPerson
}