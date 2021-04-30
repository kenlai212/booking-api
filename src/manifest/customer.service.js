"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const customerDomain = require("./customer.domain");

async function newCustomer(input){
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

    return await customerDomain.newCustomer(input);
}

async function deleteCustomer(input){
    const schema = Joi.object({
		customerId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    return await customerDomain.deleteCustomer(input.customerId);
}

module.exports = {
	newCustomer,
    deleteCustomer
}