"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const customerDomain = require("./customer.domain");
const personDomain = require("./person.domain");
const customerHelper = require("./customer.helper");
const externalPersonService = require("./externalPerson.service");

async function newCustomer(input, user) {
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

	//check for existing customer with this personId
	let existingCustomer = await customerDomain.readCustomerByPersonId(person.personId);

	if(existingCustomer)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Customer already exist" };

	const createCustomerInput = {
		personId : input.personId,
		status : "ACTIVE"
	}
	
	customer = await customerDomain.createCustomer(createCustomerInput);

	return customer;
}

async function updateStatus(input) {
	const schema = Joi.object({
		customerId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

	customerHelper.validateInput(input.status);

	let customer = await customerDomain.readCustomer(input.customerId);

	customer.status = input.status;

	return await customerDomain.updateCustomer(customer);
}

async function updatePersonId(input){
	const schema = Joi.object({
		customerId: Joi.string().required(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let customer = await customerDomain.readCustomer(input.customerId);

	let person = await personDomain.readPerson(input.personId);

	customer.personId = person.personId;

	return await customerDomain.updateCustomer(customer);
}

module.exports = {
	newCustomer,
	updateStatus,
	updatePersonId
}