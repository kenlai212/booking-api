"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Customer, CustomerPerson } = require("./customer.model");
const customerHelper = require("./customer.helper");
const customerPersonHelper = require("./customerPerson.helper");

async function createCustomer(input) {
	const schema = Joi.object({
		personId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

    let customer = new Customer();
	customer.status = "ACTIVE";

	let customerPerson = await customerPersonHelper.findCustomerPerson(input.personId);
	
	//check for existing customer with this personId
	let existingCustomer;
	try{
		existingCustomer = await Customer.findOne({personId: customerPerson.personId});
	}catch(error){
		logger.error("Customer.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	if(existingCustomer)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Customer already exist" };

	customer.personId = input.personId;
	
	return await customerHelper.saveCustomer(customer);
}

async function deleteCustomer(input) {
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	const customer = await customerHelper.getCustomer(input.customerId);

	try {
		await Customer.findByIdAndDelete(customer._id.toString());
	} catch (error) {
		logger.error("Customer.findByIdAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
	}

	return { "status": "SUCCESS" }
}

async function updateStatus(input) {
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		status: Joi
			.string()
			.valid("ACTIVE","INACTIVE")
			.required()
	});
	utility.validateInput(schema, input);

	let customer = await customerHelper.getCustomer(input.customerId);

	customer.status = input.status;

	return await saveCustomer(customer);
}

async function updatePersonId(input){
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required(),
		personId: Joi
			.string()
	});
	utility.validateInput(schema, input);

	let customer = await customerHelper.getCustomer(input.customerId);

	let customerPerson = await customerPersonHelper.getCustomerPerson(input.personId);

	customer.personId = customerPerson.personId;

	return await saveCustomer(customer);
}

module.exports = {
	createCustomer,
	deleteCustomer,
	updateStatus,
	updatePersonId
}