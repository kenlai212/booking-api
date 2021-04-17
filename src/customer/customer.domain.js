"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Customer } = require("./customer.model");

async function createCustomer(input) {
	const schema = Joi.object({
		personId: Joi.string(),
		status: Joi.string().required()
		
	});
	utility.validateInput(schema, input);

    let customer = new Customer();
	customer.status = input.status;
	customer.personId = input.personId;

	try{
		customer = await customer.save();
	}catch(error){
		logger.error("customer.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
	}

	return customer;
}

async function readCustomer(customerId){
	if (!mongoose.Types.ObjectId.isValid(customerId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };

	let customer;
	try {
		customer = await Customer.findById(customerId);
	} catch (err) {
		logger.error("Customer.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}
	
	if (!customer)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };

	return customer;
}

async function readCustomerByPersonId(personId){
	let customer;
	try {
		customer = await Customer.findOne({personId: personId});
	} catch (err) {
		logger.error("Customer.findone Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	return customer;
}

async function deleteCustomer(customerId) {
	try {
		await Customer.findByIdAndDelete(customerId);
	} catch (error) {
		logger.error("Customer.findByIdAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
	}

	return { "status": "SUCCESS" }
}

async function updateCustomer(customer){
	try {
		customer = await customer.save();
	} catch (err) {
		logger.error("customer.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
	}

	return customer;
}

module.exports = {
	createCustomer,
	readCustomer,
	readCustomerByPersonId,
	updateCustomer,
	deleteCustomer
}