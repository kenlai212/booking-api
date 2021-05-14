"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Person } = require("./user.model");

async function createPerson(input){
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

async function deletePerson(personId){
	try {
		await Person.findByIdAndDelete(personId);
	} catch (error) {
		logger.error("Person.findOneAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Person Error" };
	}
}

async function deleteAllPeople(){
	try {
		await Person.deleteMany();
	} catch (error) {
		logger.error("Person.deleteMany() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete People Error" };
	}
}

module.exports = {
    createPerson,
    readPerson,
    readPersonByEmailAddress,
    readPersonByPhoneNumber,
    deletePerson,
	deleteAllPeople
}