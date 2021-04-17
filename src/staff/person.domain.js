"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Person } = require("./staff.model");

async function createPerson(input){
    const schema = Joi.object({
		personId: Joi.string().min(1).required(),
        name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
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

    if(input.dob)
    person.dob = input.dob;

    if(input.gender)
    person.gender = input.gender;

    if(input.phoneNumber){
        person.countryCode(input.countryCode);
        person.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress)
    person.emailAddress = input.emailAddress;

    if(input.profilePictureUrl)
    person.profilePictureUrl = input.profilePictureUrl;    

    try{
        person = await person.save();
    }catch(error){
        logger.error("person.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
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

async function readPersonByEmailAddress(emailAddress){
    let person;
	try{
		person = Person.findOne({emailAddress: emailAddress});
	}catch(error){
		logger.error("Person.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

    return person;
}

async function readPersonByPhoneNumber(countryCode, phoneNumber){
    let person;
	try{
		person = Person.findOne({countryCode: countryCode, phoneNumber: phoneNumber});
	}catch(error){
		logger.error("Person.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

    return person;
}

module.exports = {
    createPerson,
    readPerson,
    readPersonByEmailAddress,
    readPersonByPhoneNumber
}