"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const personDomain = require("./person.domain");

async function customerToOutputObj(customer){
    let outputObj = new Object();
    outputObj.creationTime = customer.creationTime;
    outputObj.lastUpdateTime = customer.lastUpdateTime;

    if(customer.requestorId)
    outputObj.requestorId = customer.requestorId;

    outputObj.customerId = customer._id.toString();
    outputObj.status = customer.status;
    outputObj.personId = customer.personId;

    let person = await personDomain.readPerson(customer.personId);
    
    //since person is based on event, it could still be waiting for eventual consistancy
    //so, only use person if available.
    if(person){
        outputObj.name = person.name;

        if(person.dob)
        outputObj.dob = person.dob;

        if(person.gender)
        outputObj.gender = person.gender;

        if(person.phoneNumber){
            outputObj.countryCode = person.countryCode;
            outputObj.phoneNumber = person.phoneNumber;
        }

        if(person.emailAddress)
        outputObj.emailAddress = person.emailAddress;

        if(person.profilePictureUrl)
        outputObj.profilePictureUrl = person.profilePictureUrl;
    }

    return outputObj;
}

function validateStatus(status){
    const validStatuses = [ "ACTIVE", "INACTIVE" ]

    if(!validStatuses.includes(status))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid status" };
}

module.exports = {
    customerToOutputObj,
	validateStatus
}