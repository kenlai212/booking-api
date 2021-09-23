"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const personDao = require("./person.dao");
const {Person} = require("./person.model");

async function newPerson(input){
    const schema = Joi.object({
		personId: Joi.string().required(),
		roles: Joi.array().items(Joi.string())
	});
	lipslideCommon.validateInput(schema, input);

	const existingPerson = await personDao.find(input.personId);

	if(existingPerson){
		logger.error(`Person(${input.personId}) already exist`);
		throw { name: customError.BAD_REQUEST_ERROR, message: `Person(${input.personId}) already exist` }
	}

	let person = new Person();
	person._id = input.personId;

	if(input.roles)
	person.roles = input.roles;

	person = await personDao.save(person);

    return person; 
}

async function findPerson(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const person = await personDao.find(input.personId);

	if(!person)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid personId" };

	return person;
}

async function deletePerson(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

    await personDao.del(input.personId);

	return {status: "SUCCESS"}
}

async function deleteAllPersons(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await personDao.deleteAll();

	logger.info("Delete all Person");

	return {status: "SUCCESS"}
}

module.exports = {
	newPerson,
	findPerson,
	deletePerson,
	deleteAllPersons
}