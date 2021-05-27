"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const personDomain = require("./person.domain");
const personHelper = require("./person.helper");

async function newPerson(input){
    const schema = Joi.object({
		personId: Joi.string().required(),
        roles: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

    let createPersonInput = new Object();
    createPersonInput.personId = input.personId;
    
    if(input.roles){
        createPersonInput.roles = [];

        input.roles.forEach(role => {
            personHelper.validateRole(role);
            
            createPersonInput.roles.push(role);
        });
    }
        
    let person = await personDomain.createPerson(createPersonInput);

    logger.info(`Added new UserPerson(${person.personId})`);

    return person;
}

async function getPerson(input){
    const schema = Joi.object({
		personId: Joi.string().required()
	});

	utility.validateInput(schema, input);

    return await personDomain.readPerson(input.personId);
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
    getPerson,
    deletePerson,
    deleteAllPeople
}