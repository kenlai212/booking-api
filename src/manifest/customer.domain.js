"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Customer} = require("./manifest.model");

async function createCustomer(input){
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
    
    let customer = new Customer();
    customer.customerId = input.customerId;
    customer.personId = input.personId;
    customer.name = input.name;

    if(input.gender)
    customer.gender = input.gender;

    if(input.phoneNumber){
        customer.countryCode = input.countryCode;
        customer.phoneNumber = input.phoneNumber;
    }

    if(input.emailAddress)
    customer.emailAddress = input.emailAddress;

    if(input.profilePictureUrl)
    customer.profilePictureUrl = inpuut.profilePictureUrl;

    try{
        customer = await customer.save();
    }catch(error){
        logger.error("customer.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
    }

    return customer;
}

async function readCustomer(customerId){
    if (!mongoose.Types.ObjectId.isValid(bookingId))
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

    let customer;
    try{
        customer = await Customer.findById(customerId);
    }catch(error){
        logger.error("Customer.findById error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
    }

    if(!customer)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };
}

async function deleteCustomer(customerId){
    try{
        await Customer.findOneAndDelete({customerId: customerId});
    }catch(error){
        logger.error("Customer.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
    }

    return {status: "SUCCESS"}
}

module.exports = {
	createCustomer,
    readCustomer,
    deleteCustomer
}