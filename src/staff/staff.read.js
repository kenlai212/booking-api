"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Customer } = require("./customer.model");

async function findCustomer(input, user) {

	//validate input data
	const schema = Joi.object({
		id: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	if (!mongoose.Types.ObjectId.isValid(input.id))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };

	let targetCustomer;

	//try to find targetCustomer by id first
	try {
		targetCustomer = await Customer.findById(input.id);
	} catch (err) {
		logger.error("Customer.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//if no targetCustomer found, try to find by partyId 
	if(!targetCustomer){
		try {
			targetCustomer = await Customer.findOne({partyId : input.id});
		} catch (err) {
			logger.error("Customer.findOne Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
	}

	if(!targetCustomer)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };

	return customerToOutputObj(targetCustomer);
}

async function searchCustomers(input, user) {
	//validate input data
	const schema = Joi.object({
		status: Joi
			.string()
			.valid("ACTIVE", "INACTIVE", null)
	});
	utility.validateInput(schema, input);

	let searchCriteria;
	if (input.status != null) {
		searchCriteria = {
			"status": input.status
		}
	}

	let customers;
	try {
		customers = await Customer.find(searchCriteria);
	} catch (err) {
		logger.error("Customer.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	customers.forEach((item) => {
		outputObjs.push(customerToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"customers": outputObjs
	};
}

function customerToOutputObj(customer) {
	var outputObj = new Object();
	outputObj.id = customer._id.toString();
	outputObj.status = customer.status;
	outputObj.partyId = customer.partyId;

	outputObj.personalInfo = customer.personalInfo;

	if(customer.contact.telephoneNumber != null || customer.contact.emailAddress != null){
		outputObj.contact = customer.contact;
	}
	
	if(customer.picture.url != null){
		outputObj.picture = customer.picture;
	}

	return outputObj;
}

module.exports = {
	searchCustomers,
	findCustomer
}