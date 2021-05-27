"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const personDomain = require("./person.domain");
const personHelper = require("./person.helper");

const NEW_PERSON_QUEUE_NAME = "NEW_PERSON";
const DELETE_PERSON_QUEUE_NAME = "DELETE_PERSON";
const UPDATE_PERSON_ROLES_QUEUE_NAME = "UPEDATE_PERSON_ROLES";
const UPDATE_PERSON_PROFILE_PICTURE_QUEUE_NAME = "UPDATE_PERSON_PROFILE_PICTURE";
const UPDATE_PERSON_MOBILE_QUEUE_NAME = "UPDATE_PERSON_MOBILE";
const UPDATE_PERSON_EMAILADDRESS_QUEUE_NAME = "UPDATE_PERSON_EMAILADDRESS";
const UPDATE_PERSON_NAME_QUEUE_NAME = "UPDATE_PERSON_NAME";
const UPDATE_PERSON_DOB_QUEUE_NAME = "UPDATE_PERSON_DOB";
const UPDATE_PERSON_GENDER_QUEUE_NAME = "UPDATE_PERSON_GENDER";

async function newPerson(input){
	const schema = Joi.object({
		requestorId: Joi.string(),
		userId: Joi.string(),
		name: Joi.string().required(),
		dob: Joi.date().iso(),
		gender: Joi.string(),
		phoneNumber: Joi.string(),
		countryCode: Joi.string(),
		emailAddress: Joi.string(),
		role: Joi.string(),
		preferredContactMethod: Joi.string(),
		preferredLanguage: Joi.string()
	});
	utility.validateInput(schema, input);

	let createPersonInput = new Object();

	if(input.requestorId)
	createPersonInput.requestorId = input.requestorId;

	createPersonInput.name = input.name;
	
	if(input.dob){
		personHelper.validateDob(input.dob, 0);
		createPersonInput.dob = utility.isoStrToDate(input.dob, 0);
	}

	if(input.gender){
		personHelper.validateGender(input.gender);
		createPersonInput.gender = input.gender;
	}

	if(input.phoneNumber){
		personHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
		createPersonInput.countryCode = input.countryCode;
		createPersonInput.phoneNumber = input.phoneNumber;
	}

	if(input.emailAddress){
		personHelper.validateEmailAddress(input.emailAddress);
		createPersonInput.emailAddress = input.emailAddress;
	}

	if(input.role){
		personHelper.validateRole(input.role);
		createPersonInput.role = input.role;
	}

	if(input.preferredContactMethod){
		personHelper.validateContactMethod(input.preferredContactMethod);
		createPersonInput.preferredContactMethod = input.preferredContactMethod;
	}

	if(input.preferredLanguage){
		personHelper.validateLanguage(input.preferredLanguage);
		createPersonInput.preferredLanguage = input.preferredLanguage;
	}

	if(input.userId)
	createPersonInput.userId = input.userId;

	let person = await personDomain.createPerson(createPersonInput);

	//publish new person event
	let newPersonMsg = personHelper.personToOutputObj(person);

	await utility.publishEvent(newPersonMsg, NEW_PERSON_QUEUE_NAME, async () => {
		logger.error("rolling back new person");
		
		await personDomain.deletePerson(person._id);
	});

	logger.info(`Added new Person(${person._id})`);

	return newPersonMsg;
}

async function deletePerson(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await utility.publishEvent({personId: input.personId}, DELETE_PERSON_QUEUE_NAME, () => {
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Person Event Error" };
	});

	await personDomain.deletePerson(input.personId);

	logger.error(`Deleted Person(${input.personId})`);

	return { status: "SUCCESS"}
}

async function updateRoles(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		role: Joi
			.string()
			.required(),
        action: Joi
            .string()
            .valid("ADD","REMOVE")
            .required()
	});
	utility.validateInput(schema, input);

	personHelper.validateRole(input.role);

	let person = await personDomain.readPerson(input.personId);

	//holding old roles in memory incase we need to roll back
	const oldRoles = {...person.roles};

    if(input.action === "ADD"){
        if(!person.roles){
            person.roles = [];
        }

        person.roles.forEach(role => {
            if(role === input.role){
                throw { name: customError.BAD_REQUEST_ERROR, message: `This person is already in the ${role} role` };	
            }
        });
    
        person.roles.push(input.role);
    }else if(input.action === "REMOVE"){
        if(!person.roles){
            throw { name: customError.BAD_REQUEST_ERROR, message: `This person dosen't belong to the ${input.role} role` };
        }
    
        let removed = false;
        person.roles.forEach(function (role, index, object) {
            if (role === input.role) {
                object.splice(index, 1);
                removed = true;
            }
        });
    
        if(!removed){
            throw { name: customError.BAD_REQUEST_ERROR, message: `This person dosen't belong to the ${input.role} role` };
        }
    }

	person = await personDomain.updatePerson(person);
	
	await utility.publishEvent(input, UPDATE_PERSON_ROLES_QUEUE_NAME, user, async () => {
		logger.error("rolling back update roles");
		
		person.roles = oldRoles;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateProfilePicture(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		pictureUrl: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	personHelper.validatePictureInput(input.picture);

	let person = await personDomain.readPerson(input.personId);

	//hold the old picture url, incase we need to rollback
	const oldPictureUrl = {...person.profilePictureUrl}

	person.profilePictureUrl = input.pictureUrl;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_PROFILE_PICTURE_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit picture");
		
		person.picture = oldPicture;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateMobile(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.required(),
		phoneNumber: Joi
			.string()
			.required(),
		countryCode: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);
	
	personHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);

	let person = await personDomain.readPerson(input.personId);

	const oldCountryCode = {...person.countryCode};
	const oldPhoneNumber = {...person.phoneNumber};

	person.countryCode = input.countryCode;
	person.phoneNumber = input.phoneNumber;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_MOBILE_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit mobile");
		
		person.countryCode = oldCountryCode;
		person.phoneNumber = oldPhoneNumber;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateEmailAddress(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		emailAddress: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);
	
	personHelper.validateEmailAddress(input.emailAddress);

	let person = await personDomain.readPerson(input.personId);

	//hold the old emailAddress, in case we need to roll back
	const oldEmailAddress = {...person.emailddress};

	person.emailAddresses = input.emailAddress;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_EMAILADDRESS_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit emailAddress");
		
		person.emailAddress = oldEmailAddress;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateName(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		name: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);
	
	let person = await personDomain.readPerson(input.personId);

	//hold the old name, in case we need to roll back
	const oldName = {...person.name};

	person.name = input.name;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_NAME_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit name");
		
		person.name = oldName;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateDob(input, user){
	const schema = Joi.object({
		personId: Joi.string().min(1).required(),
		dob: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required()
	});
	utility.validateInput(schema, input);

	const birthday = personHelper.validateDob(input.dob, input.utcOffset);
	
	let person = await personDomain.readPerson(input.personId);

	//hold the old dob, in case we need to roll back
	const oldDob = {...person.dob};

	person.dob = birthday;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_DOB_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit dob");
		
		person.dob = oldDob;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updateGender(input, user){
	const schema = Joi.object({
		personId: Joi.string().required(),
		gender: Joi.string().required()
	});
	utility.validateInput(schema, input);
	
	personHelper.validateGender(input.gender);

	let person = await personDomain.readPerson(input.personId);

	//hold the old gender, in case we need to roll back
	const oldGender = {...person.gender};

	person.gender = input.gender;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_GENDER_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit dob");
		
		person.gender = oldGender;
		person = await personDomain.updatePerson(person);
	});

	return personHelper.personToOutputObj(person);
}

async function updatePreferredLanguage(input){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		language: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);
	
	personHelper.validateLanguage(input.language);

	let person = await personDomain.readPerson(input.personId);

	person.preferredLanguage = input.preferredLanguage;

	person = await personDomain.updatePerson(person);

	return personHelper.personToOutputObj(person);
}

async function updatePreferredContactMethod(input){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		contactMethod: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);
	
	personHelper.validateContactMethod(input.contactMethod);

	let person = await personDomain.readPerson(input.personId);

	person.preferredContactMethod = input.preferredContactMethod;

	person = await personDomain.updatePerson(person);

	return personHelper.personToOutputObj(person);
}

async function updateUserId(input){
    const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required(),
		userId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	person.userId = input.userId;

	person = await personDomain.updatePerson(person);
	
	return personHelper.personToOutputObj(person);
}

async function sendMessage(input, user){
	const schema = Joi.object({
		personId: Joi.string().required(),
		body: Joi.string().min(1).required(),
		title: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	const contactMethod = personHelper.getContactMethod(person);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = SEND_SMS_QUEUE_NAME;
			eventMsg = {
				subject: input.title,
				message: input.body,
				number: `${person.countryCode}${person.phoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = SEND_EMAIL_QUEUE_NAME;
			eventMsg = {
				subject: input.title,
				emailBody: input.body,
				recipient: person.emailAddress,
				sender: "admin@hebewake.com"
			}
		break;
		default:
			throw { name: customError.INTERNAL_SERVER_ERROR, message: `Bad contact method: ${contactMethod}` };
	}

	await utility.publishEvent(eventMsg, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function deleteAllPeople(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await personDomain.deleteAllPeople();

	logger.info("Deleted all People");

	return {status: "SUCCESS"}
}

module.exports = {
	newPerson,
	deletePerson,
	updateName,
	updateDob,
	updateGender,
	updateEmailAddress,
	updateMobile,
	updateProfilePicture,
	updateRoles,
	updatePreferredContactMethod,
	updatePreferredLanguage,
	updateUserId,
	sendMessage,
	deleteAllPeople
}