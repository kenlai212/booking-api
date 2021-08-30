"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const customerDao = require("./customer.dao");
const {Customer} = require("./customer.model");

async function newCustomer(input){
    const schema = Joi.object({
		customerId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let customer = new Customer();
	customer.customerId = input.customerId;

	customer = await customerDao.save(customer);
	
	logger.info(`Added new Customer(customerId: ${customer.customerId})`);

    return customer; 
}

async function findCustomer(input){
	const schema = Joi.object({
		customerId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const customer = await customerDao.find(input.customerId);

	return customer;
}

async function deleteCustomer(input){
	const schema = Joi.object({
		customerId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

    await customerDao.del(input.customerId);

	logger.info(`Deleted Customer(${input.customerId})`);

	return {status: "SUCCESS"}
}

async function deleteAllCustomers(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await customerDao.deleteAll();

	logger.info("Delete all Customers");

	return {status: "SUCCESS"}
}

module.exports = {
	newCustomer,
	findCustomer,
	deleteCustomer,
	deleteAllCustomers
}