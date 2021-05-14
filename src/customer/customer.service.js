"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const customerDomain = require("./customer.domain");
const personDomain = require("./person.domain");
const customerHelper = require("./customer.helper");
const externalPersonService = require("./externalPerson.service");

const NEW_CUSTOMER_QUEUE_NAME = "NEW_CUSTOMER";
const DELETE_CUSTOMER_QUEUE_NAME = "DELETE_CUSTOMER";
const UPDATE_CUSTOMER_STATUS_QUEUE_NAME = "UPDATE_CUSTOMER_STATUS";

async function newCustomer(input) {
	const schema = Joi.object({
		requestorId: Joi.string(),
		personId: Joi.string(),
		name: Joi.string(),
		phoneNumber: Joi.string(),
		countryCode: Joi.string(),
		emailAddress: Joi.string()
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
		let externalNewPersonInput = new Object();

		if(input.requestorId)
		externalNewPersonInput.requestorId = input.requestorId;

		externalNewPersonInput.name = input.name;
		externalNewPersonInput.role = "CUSTOMER";

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
		requestorId: input.requestorId,
		personId : person.personId,
		status : "ACTIVE"
	}

	let customer = await customerDomain.createCustomer(createCustomerInput);

	//publish NEW_CUSTOMER event
	const newCustomerMsg = await customerHelper.customerToOutputObj(customer);

	await utility.publishEvent(newCustomerMsg, NEW_CUSTOMER_QUEUE_NAME, async () => {
		logger.error("rolling back new customer");
		
		await customerDomain.deleteCustomer(newCustomerMsg.customerId);
	});

	logger.info(`Added new Customer(${newCustomerMsg.customerId})`);

	return newCustomerMsg;
}

async function updateStatus(input) {
	const schema = Joi.object({
		customerId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

	customerHelper.validateStatus(input.status);

	let customer = await customerDomain.readCustomer(input.customerId);

	const oldStatus = {...customer.status};

	customer.status = input.status;
	customer = await customerDomain.updateCustomer(customer);

	//publish UPDATE_CUSTOMER_STATUS event
	const updateCustomerStatusMsg = {
		customerId: customer._id,
		status: customer.status
	}

	await utility.publishEvent(updateCustomerStatusMsg, UPDATE_CUSTOMER_STATUS_QUEUE_NAME, async () => {
		logger.error("rolling back update status");
		
		customer.status = oldStatus;
		await customerDomain.updateCustomer(customer);
	});

	return customerHelper.customerToOutputObj(customer);
}

async function deleteCustomer(input){
	const schema = Joi.object({
		customerId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	//publish DELETE_CUSTOMER event
	const deleteCustomerMsg = {customerId : input.customerId};

	await utility.publishEvent(deleteCustomerMsg, DELETE_CUSTOMER_QUEUE_NAME, async () => {
		logger.error("Publish DELETE_CUSTOMER event failed.");
	});

	await customerDomain.deleteCustomer(input.customerId);

	logger.info(`Deleted Customer(${input.customerId})`);

	return {status:"SUCCESS"}
}

async function deleteAllCustomers(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await customerDomain.deleteAllCustomers();

	logger.info("Deleted all Customers");

	return {status: "SUCCESS"}
}

module.exports = {
	newCustomer,
	updateStatus,
	deleteCustomer,
	deleteAllCustomers
}