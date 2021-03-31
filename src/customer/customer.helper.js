"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

function validateGender(gender){
	const validGender = [
		"MALE",
		"FEMALE"
	]

	if(!validGender.includes(gender))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid gender" };
}

function validateDob(dob, utcOffset){
	utility.validateDateIsoStr(dob, utcOffset);

	//TODO cannot be later then today
	//TODO cannot be under 18

	return true;
}

function validateEmailAddress(emailAddress){
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
	if(re.test(String(emailAddress).toLowerCase())){
		return true;
	}else{
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid emailAddress format" };
	}
}

function validatePhoneNumber(countryCode, phoneNumber){
	const validCountryCode = [
		"852",
		"853",
		"82"
	]

	if(!validCountryCode.includes(countryCode))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid countryCode" };

	if(phoneNumber.length < 7)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid phoneNumber" };

	return true;
}

async function getCustomer(customerId){
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
	getCustomer,
    saveCustomer,
	validateGender,
	validateDob,
	validateEmailAddress,
	validatePhoneNumber
}