"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const personService = require("../person/person.service");

async function newPerson(input){
    const schema = Joi.object({
		requestorId: Joi.string(),
		name: Joi.string().required(),
		phoneNumber: Joi.string(),
		countryCode: Joi.string(),
		emailAddress: Joi.string(),
		role: Joi.string(),
	});
	utility.validateInput(schema, input);

    let person = await personService.newPerson(input);

    return person;
}

module.exports = {
	newPerson
}