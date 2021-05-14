"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Person} = require("./person.model");

async function createPerson(input){
	const schema = Joi.object({
		requestorId: Joi.string(),
		userId: Joi.string(),
		name: Joi.string().required(),
		dob: Joi.date().iso(),
		gender: Joi.string(),
		phoneNumber: Joi.string(),
		countryCode: Joi.string(),
		emailAddress: Joi.string(),
		role: Joi.string(),
		preferredContactMethod: Joi.string(),
		preferredLanguage: Joi.string()
	});
	utility.validateInput(schema, input);

	let person = new Person();

	if(input.requestorId)
	person.requestorId = input.requestorId;

	person.creationTime = new Date();
    person.lastUpdateTime = new Date();
	
	person.name = input.name;
	
	if(input.dob)
	person.dob = input.dob;

	if(input.gender)
	person.gender = input.gender;

	if(input.phoneNumber){
		person.countryCode = input.countryCode;
		person.phoneNumber = input.phoneNumber;
	}

	if(input.emailAddress)
	person.emailAddress = input.emailAddress;

	if(input.role){
		person.roles = [];
		person.roles.push(input.role);
	}

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

async function readPersons(){
	let persons;
	try {
		persons = await Person.find();
	} catch (error) {
		logger.error("Person.find Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	return persons;
}

async function readPersonsByName(name){
	let persons;
	try {
		persons = await Person.find({
			"name": name
		});
	} catch (error) {
		logger.error("Person.find Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	return persons;
}

async function updatePerson(person){
	person.lastUpdateTime = new Date();

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

	return;
}

async function deleteAllPeople(){
	try {
		await Person.deleteMany();
	} catch (error) {
		logger.error("Person.deleteMany() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete People Error" };
	}

	return;
}

module.exports = {
    createPerson,
	readPerson,
	readPersons,
	readPersonsByName,
	updatePerson,
	deletePerson,
	deleteAllPeople
}