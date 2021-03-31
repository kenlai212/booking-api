"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Person} = require("./person.model");
const personHelper = require("./person.helper");

async function updateRoles(input){
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

	let person = await personHelper.getPerson(input.personId);

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

	person = await personHelper.savePerson(person);
	
	const eventQueueName = "updatePersonRoles";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back update roles");
		
		person.roles = oldRoles;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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

	let person = await personHelper.getPerson(input.personId);

	//hold the old picture url, incase we need to rollback
	const oldPictureUrl = {...person.profilePictureUrl}

	person.profilePictureUrl = input.pictureUrl;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonPicture";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit picture");
		
		person.picture = oldPicture;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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

	let person = await personHelper.getPerson(input.personId);

	//hold the old mobile, in case we need to roll back
	const oldMobile = {...person.mobile};

	const mobile = {
		countryCode: input.countryCode,
		phoneNumber: input.phoneNumber
	}

	person.mobile = mobile;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonMobile";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit mobile");
		
		person.mobile = oldMobile;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Rollback Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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

	let person = await personHelper.getPerson(input.personId);

	//hold the old emailAddress, in case we need to roll back
	const oldEmailAddress = {...person.emailddress};

	person.emailAddresses = input.emailAddress;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonEmailAddress";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit emailAddress");
		
		person.emailAddress = oldEmailAddress;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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
	
	let person = await personHelper.getPerson(input.personId);

	//hold the old name, in case we need to roll back
	const oldName = {...person.name};

	person.name = input.name;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonName";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit name");
		
		person.name = oldName;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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
	
	let person = await personHelper.getPerson(input.personId);

	//hold the old dob, in case we need to roll back
	const oldDob = {...person.dob};

	person.dob = birthday;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonDob";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit dob");
		
		person.dob = oldDob;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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

	let person = await personHelper.getPerson(input.personId);

	//hold the old gender, in case we need to roll back
	const oldGender = {...person.gender};

	person.gender = input.gender;

	person = await personHelper.savePerson(person);

	const eventQueueName = "editPersonGender";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit dob");
		
		person.gender = oldGender;
		try{
			person = await person.save();
		}catch(error){
			logger.error("person.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Person Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
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

	let person = await personHelper.getPerson(input.personId);

	person.preferredLanguage = input.preferredLanguage;

	person = await personHelper.savePerson(person);

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

	let person = await personHelper.getPerson(input.personId);

	person.preferredContactMethod = input.preferredContactMethod;

	person = await personHelper.savePerson(person);

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

	let person = await personHelper.getPerson(input.personId);

	person.userId = input.userId;

	person = await personHelper.savePerson(person);
	
	return {
		status : "SUCCESS",
		message: `Updated userId(${person.userId})`,
		person: person
	};
}

async function createPerson(input, user){
	const schema = Joi.object({
		userId: Joi.string().min(1).allow(null),
		name: Joi.string().required(),
		dob: Joi.date().iso().allow(null),
		utcOffset: Joi.number().min(-12).max(14).allow(null),
		gender: Joi.string().allow(null),
		phoneNumber: Joi.string().allow(null),
		countryCode: Joi.string().allow(null),
		emailAddress: Joi.string().allow(null),
		role: Joi.string().allow(null),
		preferredContactMethod: Joi.string().allow(null),
		preferredLanguage: Joi.string().allow(null)
	});
	utility.validateInput(schema, input);
	
	let person = new Person();
	person.creationTime = new Date();
    person.lastUpdateTime = new Date();
	person.name = input.name;
	
	if(input.dob){
		personHelper.validateDob(input.dob, input.utcOffset);
		person.dob = utility.isoStrToDate(input.dob, input.utcOffset);
	}

	if(input.gender){
		personHelper.validateGender(input.gender);
		person.gender = input.gender;
	}

	if(input.phoneNumber){
		personHelper.validatePhoneNumber(input.countryCode, input.phoneNumber);
		person.countryCode = input.countryCode;
		person.phoneNumber = input.phoneNumber;
	}

	if(input.emailAddress){
		personHelper.validateEmailAddress(input.emailAddress);
		person.emailAddress = input.emailAddress;
	}

	if(input.role){
		personHelper.validateRole(input.role);
		person.roles = [];
		person.roles.push(input.role);
	}
		

	if(input.preferredContactMethod){
		personHelper.validateContactMethod(input.preferredContactMethod);
		person.preferredContactMethod = input.preferredContactMethod;
	}

	if(input.preferredLanguage){
		personHelper.validateLanguage(input.preferredLanguage);
		person.preferredLanguage = input.preferredLanguage;
	}

	if(input.userId)
		person.userId = input.userId;

	person = await personHelper.savePerson(person);

	const eventQueueName = "newPerson";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back new person");
		
		try{
			await Person.findOneAndDelete({ _id: person._id });
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find and Delete Person Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		eventMsg: person
	};
}

async function deletePerson(input, user){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	const person = await personHelper.getPerson(input.personId);

	try {
		await Person.findOneAndDelete({ _id: person._id });
	} catch (error) {
		logger.error("Person.findOneAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Person Error" };
	}

	const eventQueueName = "deletePerson";
	utility.publishEvent(person, eventQueueName, user);

	return { 
		status: "SUCCESS",
		message: `Deleted Person(${person._id})`,
		eventMsg: person
	}
}

module.exports = {
    createPerson,
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
	updateUserId
}