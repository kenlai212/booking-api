"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const personDomain = required("./person.domain");

async function newPerson(input){
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

    let createPersonInput;
    createPersonInput.personId = input.personId;
    createPersonInput.name = input.name;

    if(input.dob){
        customerHelper.validateDob(input.dob, input.utcOffset);
        createPersonInput.dob = utility.isoStrToDate(input.dob, input.utcOffset);
    }

    if(input.gender){
        customerHelper.validateGender(input.gender);
        createPersonInput.gender = input.gender;
    }

    if(input.phoneNumber){
        customerHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
        createPersonInput.countryCode(input.countryCode);
        createPersonInput.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress){
        customerHelper.validateEmailAddress(input.emailAddress);
        createPersonInput.emailAddress = input.emailAddress;
    }

    if(input.profilePictureUrl)
        createPersonInput.profilePictureUrl = input.profilePictureUrl;
        

    let person = personDomain.createPerson(createPersonInput);

    return person;
}

module.exports = {
    newPerson
}