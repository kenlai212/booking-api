"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

async function getTargetCustomer(customerId){
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

async function saveCustomer(customer){
	try {
		customer = await customer.save();
	} catch (err) {
		logger.error("customer.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
	}

	return customer;
}

module.exports = {
	getTargetCustomer,
    saveCustomer
}