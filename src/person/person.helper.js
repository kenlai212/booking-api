"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Person} = require("./person.model");

function validateGender(gender){
	const validGender = [
		"MALE",
		"FEMALE"
	]

	if(!validGender.includes(gender))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid gender" };
}

function validateDob(dob, utcOffset){
	if(utcOffset)
		throw { name: customError.BAD_REQUEST_ERROR, message: "utcOffset is mandatory" };

	const birthday = moment(dob).add(utcOffset).toDate();

	return birthday;
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

function validateLanguage(language){
	const validLanguage = [
		"zh-Hans",
		"zh-Hant",
		"en"
	]

	if(!validLanguage.includes(language))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid language" };

	return true;
}

function validateContactMethod(contactMethod){
	const validContactMethod = [
		"SMS",
		"EMAIL",
		"WHATSAPP"
	]

	if(!validContactMethod.includes(contactMethod))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid contactMethod" };

	return true;
}

function validateRole(role){
	const validRole = [
		"CREW",
		"CUSTOMER",
		"ADMIN"
	]

	if(!validRole.includes(role))
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid role` };

	return true;
}

function personToOutputObj(person){
    let outputObj = new Object();
	outputObj.id = person._id.toString();

	if(person.userId){
		outputObj.userId = person.userId;
	}
	
	if(person.personalInfo){
		outputObj.personalInfo = new Object();

		if(person.personalInfo.name)
			outputObj.personalInfo.name = person.personalInfo.name;

		if(person.personalInfo.dob)
			outputObj.personalInfo.dob = person.personalInfo.dob;

		if(person.personalInfo.gender)
			outputObj.personalInfo.gender = person.personalInfo.gender;
	}
	
	if(person.contact){
		outputObj.contact = new Object();

		if(person.contact.emailAddress)
			outputObj.contact.emailAddress = person.contact.emailAddress;

		if(person.contact.telephoneCountryCode)
			outputObj.contact.telephoneCountryCode = person.contact.telephoneCountryCode;

		if(person.contact.telephoneNumber)
			outputObj.contact.telephoneNumber = person.contact.telephoneNumber;
	}

	if(person.picture){
		outputObj.picture = new Object();

		if(person.picture.url)
			outputObj.picture.url = person.picture.url;
	}

	if(person.roles)
		outputObj.roles = person.roles;

	if(person.preferredContactMethod){
		outputObj.preferredContactMethod = person.preferredContactMethod;
	}
	
	if(person.preferredLanguage){
		outputObj.preferredLanguage = person.preferredLanguage;
	}
	
    return outputObj;
}

function getContactMethod(person){
	if(!person.contact || (!person.contact.emailAddress && !person.contact.telephoneNumber)){
		throw { name: customError.BAD_REQUEST_ERROR, message: `No contact method available` };
	}

	let contactMethod;
	if(person.preferredContactMethod){
		contactMethod = person.preferredContactMethod;
	}else{
		if(person.contact.telephoneNumber){
			contactMethod = "SMS";
		}else{
			contactMethod = "EMAIL"
		}
	}

	return contactMethod;
}

async function getPerson(personId){
	if (!mongoose.Types.ObjectId.isValid(personId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	let person;
	try {
		person = await Person.findById(personId);
	} catch (err) {
		logger.error("Person.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	if (!person)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid personId" };

	return person;
}

async function savePerson(person){
	try{
		person = await person.save();
	}catch(error){
		logger.error("person.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
	}

	return person;
}

module.exports = {
	validateGender,
	validateDob,
	validateEmailAddress,
	validatePhoneNumber,
	validateLanguage,
	validateContactMethod,
	validateRole,
    getPerson,
	getContactMethod,
	personToOutputObj,
	savePerson
}