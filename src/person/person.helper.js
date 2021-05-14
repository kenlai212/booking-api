"use strict";
const utility = require("../common/utility");
const {customError} = utility;

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
	outputObj.personId = person._id.toString();
	outputObj.requestorId = person.requestorId;
	outputObj.creationTime = person.creationTime;
	outputObj.lastUpdateTime = person.lastUpdateTime;

	if(person.userId)
	outputObj.userId = person.userId;
	
	if(person.name)
	outputObj.name = person.name;
	
	if(person.dob)
	outputObj.dob = person.dob;

	if(person.gender)
	outputObj.gender = person.gender;

	if(person.emailAddress)
	outputObj.emailAddress = person.emailAddress;

	if(person.phoneNumber){
		outputObj.countryCode = person.countryCode;
		outputObj.phoneNumber = person.phoneNumber;
	}

	if(person.profilePictureUrl)
	outputObj.profilePictureUrl = person.profilePictureUrl;

	if(person.roles && person.roles.length > 0)
	outputObj.roles = person.roles;

	if(person.preferredContactMethod)
	outputObj.preferredContactMethod = person.preferredContactMethod;
	
	if(person.preferredLanguage)
	outputObj.preferredLanguage = person.preferredLanguage;
	
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

module.exports = {
	validateGender,
	validateDob,
	validateEmailAddress,
	validatePhoneNumber,
	validateLanguage,
	validateContactMethod,
	validateRole,
	getContactMethod,
	personToOutputObj
}