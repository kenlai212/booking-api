"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Customer} = require("./booking.model");

async function createCustomer(input){
    const schema = Joi.object({
		customerId: Joi.string().min(1).required(),
	});
	utility.validateInput(schema, input);
    
    let customer = new Customer();
    customer.customerId = input.customerId;

    try{
        customer = await customer.save();
    }catch(error){
        logger.error("customer.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
    }

    return customer;
}

async function readCustomer(customerId){
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