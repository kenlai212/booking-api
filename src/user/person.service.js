"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const personDomain = require("./person.domain");
const personHelper = require("./person.helper");

async function newPerson(input){
    const schema = Joi.object({
		personId: Joi.string().required(),
        name: Joi.string().required(),
		dob: Joi.date().iso(),
		gender: Joi.string(),
		phoneNumber: Joi.string(),
		countryCode: Joi.string(),
		emailAddress: Joi.string(),
        profilePictureUrl: Joi.string()
	});
	utility.validateInput(schema, input);

    let createPersonInput = new Object();
    createPersonInput.personId = input.personId;
    createPersonInput.name = input.name;

    if(input.dob){
        personHelper.validateDob(input.dob, 0);
        createPersonInput.dob = utility.isoStrToDate(input.dob, 0);
    }

    if(input.gender){
        personHelper.validateGender(input.gender);
        createPersonInput.gender = input.gender;
    }

    if(input.phoneNumber){
        personHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
        createPersonInput.countryCode(input.countryCode);
        createPersonInput.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress){
        personHelper.validateEmailAddress(input.emailAddress);
        createPersonInput.emailAddress = input.emailAddress;
    }

    if(input.profilePictureUrl)
    createPersonInput.profilePictureUrl = input.profilePictureUrl;
        
    let person = personDomain.createPerson(createPersonInput);

    logger.info(`Added new UserPerson(${person.personId})`);

    return person;
}

async function deletePerson(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await personDomain.deletePerson(input.personId);

    logger.info(`Delete UserPerson(${input.personId})`);

	return { status: "SUCCESS"}
}

async function deleteAllPeople(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await personDomain.deleteAllPeople();

    logger.info("Deleted all UserPeople");

	return {status: "SUCCESS"}
}


module.exports = {
    newPerson,
    deletePerson,
    deleteAllPeople
}