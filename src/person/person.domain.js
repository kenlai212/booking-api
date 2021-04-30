"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Person} = require("./person.model");

async function createPerson(input){
	const schema = Joi.object({
		userId: Joi.string().min(1).allow(null),
		name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
		gender: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
		roles: Joi.array().items(Joi.string()),
		preferredContactMethod: Joi.string().allow(null),
		preferredLanguage: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);
	
	let person = new Person();
	person.creationTime = new Date();
    person.lastUpdateTime = new Date();
	person.name = input.name;
	
	if(input.dob)
		person.dob = utility.isoStrToDate(input.dob, input.utcOffset);

	if(input.gender)
		person.gender = input.gender;

	if(input.phoneNumber){
		person.countryCode = input.countryCode;
		person.phoneNumber = input.phoneNumber;
	}

	if(input.emailAddress){
		person.emailAddress = input.emailAddress;
	}

	if(input.role)
		person.roles = input.roles;

	if(input.preferredContactMethod)
		person.preferredContactMethod = input.preferredContactMethod;

	if(input.preferredLanguage)
		person.preferredLanguage = input.preferredLanguage;

	if(input.userId)
		person.userId = input.userId;

	try{
		person = person.save()
	}catch(error){
		logger.error("person.save(() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
	}

	return person;
}

async function readPerson(personId){
	if (!mongoose.Types.ObjectId.isValid(personId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	let person;
	try {
		person = await Person.findById(personId);
	} catch (err) {
		logger.error("Person.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	if (!person)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	return person;
}

async function updatePerson(person){
	try{
		person = person.save()
	}catch(error){
		logger.error("person.save(() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
	}

	return person;
}

async function deletePerson(personId){
	try {
		await Person.findByIdAndDelete(personId);
	} catch (error) {
		logger.error("Person.findOneAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Person Error" };
	}
}

module.exports = {
    createPerson,
	readPerson,
	updatePerson,
	deletePerson
}