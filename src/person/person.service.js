"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

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
const SEND_SMS_QUEUE_NAME = "SEND_SMS";
const SEND_EMAIL_QUEUE_NAME = "SEND_EMAIL";

async function newPerson(input){
	const schema = Joi.object({
		userId: Joi.string().min(1).allow(null),
		name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
		utcOffset: Joi.number().min(-12).max(14).allow(null),
		gender: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
		roles: Joi.array().items(Joi.string()),
		preferredContactMethod: Joi.string().allow(null),
		preferredLanguage: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);
	
	let createPersonInput = new Object();
	createPersonInput.name = input.name;
	
	if(input.dob){
		personHelper.validateDob(input.dob, input.utcOffset);
		createPersonInput.dob = utility.isoStrToDate(input.dob, input.utcOffset);
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

	if(input.roles){
		createPersonInput.roles = [];

		input.roles.foreach(role => {
			personHelper.validateRole(role);
			createPersonInput.roles.push(input.role);
		});
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

	await utility.publishEvent(person, NEW_PERSON_QUEUE_NAME, async () => {
		logger.error("rolling back new person");
		
		await personDomain.deletePerson(person._id);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_PERSON_QUEUE_NAME} queue`, 
		eventMsg: person
	};
}

async function deletePerson(input){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	await personDomain.deletePerson(input.personId);

	await utility.publishEvent({personId: input.personId}, DELETE_PERSON_QUEUE_NAME, user);

	return { 
		status: "SUCCESS",
		message: `Published event to ${DELETE_PERSON_QUEUE_NAME} queue`,
		eventMsg: {personId: input.personId}
	}
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_ROLES_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_PROFILE_PICTURE_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	//hold the old mobile, in case we need to roll back
	const oldMobile = {...person.mobile};

	const mobile = {
		countryCode: input.countryCode,
		phoneNumber: input.phoneNumber
	}

	person.mobile = mobile;

	person = await personDomain.updatePerson(person);

	utility.publishEvent(input, UPDATE_PERSON_MOBILE_QUEUE_NAME, user, async () => {
		logger.error("rolling back edit mobile");
		
		person.mobile = oldMobile;
		person = await personDomain.updatePerson(person);
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_MOBILE_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_EMAILADDRESS_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_NAME_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_DOB_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Published event to ${UPDATE_PERSON_GENDER_QUEUE_NAME} queue`,
		eventMsg: person
	};
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

	return {
		status : "SUCCESS",
		message: `Changed preferredLanguage to ${input.language}`,
		party: person
	};
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

	return {
		status : "SUCCESS",
		message: `Changed preferredContactMethod to ${input.contactMethod}`,
		person: person
	};
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
	
	return {
		status : "SUCCESS",
		message: `Updated userId(${person.userId})`,
		person: person
	};
}

async function sendRegistrationInvite(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.required()
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
				subject: "Registration Invite",
				message: "Please click on the following link to register",
				number: `${person.countryCode}${person.phoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = SEND_EMAIL_QUEUE_NAME;
			eventMsg = {
				subject: "Registration Invite",
				emailBody: "Please click on the following link to register",
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

async function sendMessage(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.required(),
		body: Joi
			.string()
			.min(1)
			.required(),
		title: Joi
			.string()
			.min(1)
			.required()
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
	sendRegistrationInvite
}