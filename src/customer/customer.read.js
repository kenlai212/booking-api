"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const customerDomain = require("./customer.domain");
const customerHelper = require("./customer.helper");

async function findCustomer(input) {
	const schema = Joi.object({
		customerId: Joi.string(),
		personId: Joi.string()
	});
	utility.validateInput(schema, input);

	if(!input.customerId && !input.personId)
	throw { name: customError.BAD_REQUEST_ERROR, message: "customerId or personId is mandatory" };

	let customer;
	if(input.customerId){
		customer = await customerDomain.readCustomer(input.customerId);
	}else{
		customer = await customerDomain.readCustomerByPersonId(input.personId);

		if(!customer)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid personId" };
	}

	return await customerHelper.customerToOutputObj(customer);
}

async function searchCustomers(input) {
	const schema = Joi.object({
		status: Joi.string()
	});
	utility.validateInput(schema, input);

	let customers;
	if(input.status){
		customerHelper.validateStatus(input.status);

		customers = await customerDomain.readCustomersByStatus(input.status);
	}else{
		customers = await customerDomain.readCustomers();
	}

	var outputObjs = [];
	for(const customer of customers){
		outputObjs.push(await customerHelper.customerToOutputObj(customer));
	}

	return {
		"count": outputObjs.length,
		"customers": outputObjs
	};
}

module.exports = {
	searchCustomers,
	findCustomer
}