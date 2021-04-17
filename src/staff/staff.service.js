"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const staffDomain = require("./staff.domain");
const personDomain = require("./person.domain");
const staffHelper = require("./staff.helper");

async function newStaff(input) {
	const schema = Joi.object({
		personId: Joi.string(),
		name: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);

	if(!input.personId && !input.name)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Either personId or name is mandatory" };

	if(input.phoneNumber && !input.countryCode)
	throw { name: customError.BAD_REQUEST_ERROR, message: "countryCode is mandatory if phoneNumber provided" };

	let person;
	if(input.personId){
		//find existing person by personId
		person = await personDomain.readPerson(input.personId);
	}else{
		//find existing person by emailAddress or phoneNuber
		if(input.emailAddress)
		person = await personDomain.readPersonByEmailAddress(input.emailAddress);

		if(input.phoneNumber)
		person = await personDomain.readPersonByPhoneNumber(input.countryCode, input.phoneNumber);
	}

	if(!person){
		//create new person
		let externalNewPersonInput;
		externalNewPersonInput.name = input.name;

		if(input.phoneNumber){
			externalNewPersonInput.countryCode = input.countryCode;
			externalNewPersonInput.phoneNumber = input.phoneNumber;
		}

		if(input.emailAddress)
		externalNewPersonInput.emailAddress = input.emailAddress;

		person = await externalPersonService.newPerson(externalNewPersonInput);
	}

	//check for existing staff with this personId
	let existingStaff = await staffDomain.readStaffByPersonId(person.personId);

	if(existingStaff)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Staff already exist" };

	const createStaffInput = {
		personId : input.personId,
		status : "ACTIVE"
	}
	
	return await staffDomain.createStaff(createStaffInput);
}

async function deleteStaff(input) {
	const schema = Joi.object({
		staffId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await staffDomain.deleteStaff(input.staffId);

	return { "status": "SUCCESS" }
}

async function updateStatus(input) {
	const schema = Joi.object({
		staffId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

    staffHelper.validateStatus(status);

	let targetStaff = await staffHelper.getTargetStaff(input.customerId);

	targetStaff.status = input.status;

	return await staffDomain.updateStaff(targetStaff);
}

async function updatePersonId(input){
	const schema = Joi.object({
		staffId: Joi.string().required(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let staff = await staffDomain.readStaff(input.staffId);

	let person = await personDomain.readPerson(input.personId);

	staff.personId = person.personId;

	return await staffDomain.updateStaff(staff);
}

module.exports = {
	newStaff,
	deleteStaff,
	updateStatus,
    updatePersonId
}