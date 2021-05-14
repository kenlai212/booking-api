"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const customerDomain = require("./customer.domain");

async function newCustomer(input){
    const schema = Joi.object({
		customerId: Joi.string().required(),
        personId: Joi.string().required(),
        name: Joi.string().required(),
        gender: Joi.string(),
	    phoneNumber: Joi.string(),
	    countryCode: Joi.string(),
	    emailAddress: Joi.string(),
	    profilePictureUrl: Joi.string()
	});
	utility.validateInput(schema, input);

	let customer = await customerDomain.createCustomer(input);

	logger.info(`Add new ManifestCustomer(${input.customerId})`);

    return customer; 
}

async function deleteCustomer(input){
    const schema = Joi.object({
		customerId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await customerDomain.deleteCustomer(input.customerId);

	logger.info(`Deleted ManifestCustomer(${input.customerId})`);

    return {status: "SUCCESS"}; 
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

	logger.info("Delete all ManifestCustomers");

	return {status: "SUCCESS"}
}

module.exports = {
	newCustomer,
    deleteCustomer,
	deleteAllCustomers
}