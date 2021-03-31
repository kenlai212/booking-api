"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { CustomerPerson } = require("./customer.model");
const customerHelper = require("./customer.helper");

async function createCustomerPerson(input){
    const schema = Joi.object({
		personId: Joi.string().min(1).required(),
        name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
		utcOffset: Joi.number().min(-12).max(14).allow(null),
		gender: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
        profilePictureUrl: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);

    let customerPerson = new CustomerPerson();
    customerPerson.personId = input.personId;
    customerPerson.name = input.name;

    if(input.dob){
        customerHelper.validateDob(input.dob, input.utcOffset);
        customerPerson.dob = utility.isoStrToDate(input.dob, input.utcOffset);
    }

    if(input.gender){
        customerHelper.validateGender(input.gender);
        customerPerson.gender = input.gender;
    }

    if(input.phoneNumber){
        customerHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
        customerPerson.countryCode(input.countryCode);
        customerPerson.phoneNumber(input.phoneNumber);
    }

    if(input.emailAddress){
        customerHelper.validateEmailAddress(input.emailAddress);
        customerPerson.emailAddress = input.emailAddress;
    }

    if(input.profilePictureUrl)
        customerPerson.profilePictureUrl = input.profilePictureUrl;
        

    try{
        customerPerson = await customerPerson.save();
    }catch(error){
        logger.error("customerPerson.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CustomerPerson Error" };
    }

    return customerPerson;
}

module.exports = {
    createCustomerPerson
}