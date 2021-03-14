"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { CustomerPerson } = require("./customer.model");

async function newCustomerPerson(input){
    const schema = Joi.object({
		personId: Joi.string().min(1).required(),
        personalInfo: Joi.object().required(),
        contact: Joi.object(),
        picture: Joi.object()
	});
	utility.validateInput(schema, input);

    let customerPerson = new CustomerPerson();
    customerPerson.personId = input.personId;
    customerPerson.personalInfo = input.personalInfo;

    if(input.contact)
        customerPerson.contact = input.contact;

    if(input.picture)
        customerPerson.picture = input.picture;

    try{
        customerPerson = await customerPerson.save();
    }catch(error){
        logger.error("customerPerson.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CustomerPerson Error" };
    }

    return customerPerson;
}

module.exports = {
	newCustomerPerson
}