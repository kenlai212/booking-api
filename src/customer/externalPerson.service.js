"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const personService = require("../person/person.service");

async function newPerson(input){
    const schema = Joi.object({
		name: Joi.string().required(),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
		roles: Joi.array().items(Joi.string()),
	});
	utility.validateInput(schema, input);

    let person = await personService.newPerson(input);

    return person;
}

module.exports = {
	newPerson
}