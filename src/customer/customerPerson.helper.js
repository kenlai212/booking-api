"use strict";
const utility = require("../common/utility");
const {logger, customError} = utility;

async function getCustomerPerson(personId){
    let customerPerson;
	try{
		customerPerson = CustomerPerson.findOne({personId: personId});
	}catch(error){
		logger.error("CustomerPerson.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find CustomerPerson Error" };
	}

	if(!customerPerson)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

    return customerPerson
}

module.exports = {
	getCustomerPerson
}