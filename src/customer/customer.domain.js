"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Customer } = require("./customer.model");

async function createCustomer(input) {
	const schema = Joi.object({
		personId: Joi.string().required(),
		status: Joi.string().required(),
		requestorId: Joi.string()
	});
	utility.validateInput(schema, input);

    let customer = new Customer();
	customer.creationTime = new Date();
	customer.lastUpdateTime = new Date();

	if(input.requestorId)
	customer.requestorId = input.requestorId;

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

async function readCustomers(){
	let customers;
	try {
		customers = await Customer.find();
	} catch (err) {
		logger.error("Customer.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	return customers;
}

async function readCustomersByStatus(status){
	let customers;
	try {
		customers = await Customer.find({
			status: status
		});
	} catch (err) {
		logger.error("Customer.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
	}

	return customers;
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
	customer.lastUpdateTime = new Date();

	try {
		customer = await customer.save();
	} catch (err) {
		logger.error("customer.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
	}

	return customer;
}

async function deleteAllCustomers(){
	try {
		await Customer.deleteMany();
	} catch (err) {
		logger.error("Customer.deleteMany Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customers Error" };
	}

	return;
}

module.exports = {
	createCustomer,
	readCustomer,
	readCustomerByPersonId,
	readCustomers,
	readCustomersByStatus,
	updateCustomer,
	deleteCustomer,
	deleteAllCustomers
}