"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Person } = require("./customer.model");
const customerHelper = require("./customer.helper");

async function createPerson(input){
    const schema = Joi.object({
		personId: Joi.string().min(1).required(),
        name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
		utcOffset: Joi.number().min(-12).max(14).allow(null),
		gender: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
        profilePictureUrl: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);

    let person = new Person();
    person.personId = input.personId;
    person.name = input.name;

    if(input.dob){
        customerHelper.validateDob(input.dob, input.utcOffset);
        person.dob = utility.isoStrToDate(input.dob, input.utcOffset);
    }

    if(input.gender){
        customerHelper.validateGender(input.gender);
        person.gender = input.gender;
    }

    if(input.phoneNumber){
        customerHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
        person.countryCode(input.countryCode);
        person.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress){
        customerHelper.validateEmailAddress(input.emailAddress);
        person.emailAddress = input.emailAddress;
    }

    if(input.profilePictureUrl)
        person.profilePictureUrl = input.profilePictureUrl;
        

    try{
        person = await person.save();
    }catch(error){
        logger.error("customerPerson.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CustomerPerson Error" };
    }

    return person;
}

async function readPerson(personId){
    let person;
	try{
		person = Person.findOne({personId: personId});
	}catch(error){
		logger.error("Person.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	if(!person)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

    return person;
}

module.exports = {
    createPerson,
    readPerson
}