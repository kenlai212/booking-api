"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Customer, CustomerPerson } = require("./customer.model");
const customerHelper = require("./customer.helper");

async function newCustomer(input) {
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.allow(null)
	});
	utility.validateInput(schema, input);

	//validate person
	let customerPerson;
	try{
		customerPerson = CustomerPerson.findOne({personId: input.personId});
	}catch(error){
		logger.error("CustomerPerson.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find CustomerPerson Error" };
	}

	if(!customerPerson)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	//check if customer with the same partyId already exist
	let existingCustomer;
	try{
		existingCustomer = await Customer.findOne({personId: customerPerson.personId});
	}catch(error){
		logger.error("Customer.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	if(existingCustomer)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Customer already exist" };
	
	let customer = new Customer();
	customer.status = "ACTIVE";
	customer.personId = input.personId;
	
	return await saveCustomer(customer);
}

async function deleteCustomer(input) {
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	const targetCustomer = await customerHelper.getTargetCustomer(input.customerId);

	try {
		await Customer.findByIdAndDelete(targetCustomer._id.toString());
	} catch (err) {
		console.log(err);
		logger.error("Customer.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
	}

	return { "status": "SUCCESS" }
}

async function editStatus(input, user) {
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

	let targetCustomer = await customerHelper.getTargetCustomer(input.customerId);

	targetCustomer.status = input.status;

	return await saveCustomer(targetCustomer);
}

module.exports = {
	newCustomer,
	deleteCustomer,
	editStatus
}