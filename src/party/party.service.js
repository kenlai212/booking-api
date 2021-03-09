const Joi = require("joi");
const uuid = require('uuid');

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Party} = require("./party.model");
const partyHelper = require("./party.helper");

async function sendRegistrationInvite(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let party = await partyHelper.validatePartyId(input.partyId);

	const contactMethod = partyHelper.getContactMethod(party);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = "sendSMS";
			eventMsg = {
				subject: "Registration Invite",
				message: "Please click on the following link to register",
				number: `${party.contact.telephoneCountryCode}${party.contact.telephoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = "sendEmail";
			eventMsg = {
				subject: "Registration Invite",
				emailBody: "Please click on the following link to register",
				recipient: party.contact.emailAddress,
				sender: "admin@hebewake.com"
			}
		break;
		default:
			throw { name: customError.INTERNAL_SERVER_ERROR, message: `Bad contact method: ${contactMethod}` };
	}

	utility.publishEvent(eventMsg, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function sendMessage(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
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

	let party = await partyHelper.validatePartyId(input.partyId);

	const contactMethod = partyHelper.getContactMethod(party);

	let eventQueueName;
	let eventMsg;
	switch(contactMethod){
		case "SMS":
			eventQueueName = "sendSMS";
			eventMsg = {
				subject: input.title,
				message: input.body,
				number: `${party.contact.telephoneCountryCode}${party.contact.telephoneNumber}`
			}
		break;
		case "EMAIL":
			eventQueueName = "sendEmail";
			eventMsg = {
				subject: input.title,
				emailBody: input.body,
				recipient: party.contact.emailAddress,
				sender: "admin@hebewake.com"
			}
		break;
		default:
			throw { name: customError.INTERNAL_SERVER_ERROR, message: `Bad contact method: ${contactMethod}` };
	}

	utility.publishEvent(eventMsg, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function removeRole(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		role: Joi
			.string()
			.valid("CREW","CUSTOMER","ADMIN")
			.required()
	});
	utility.validateInput(schema, input);

	let party = await partyHelper.validatePartyId(input.partyId);

	if(!party.roles){
		throw { name: customError.BAD_REQUEST_ERROR, message: `This party dosen't belong to the ${input.role} role` };
	}

	let removed = false;
	party.roles.forEach(function (role, index, object) {
		if (role === input.role) {
			object.splice(index, 1);
			removed = true;
		}
	});

	if(!removed){
		throw { name: customError.BAD_REQUEST_ERROR, message: `This party dosen't belong to the ${input.role} role` };
	}

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}
	
	return {
		status : "SUCCESS",
		message: `Removed ${input.role} role from party(${party._id})`,
		party: party
	};
}

async function addRole(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		role: Joi
			.string()
			.valid("CREW","CUSTOMER","ADMIN")
			.required()
	});
	utility.validateInput(schema, input);

	let party = await partyHelper.validatePartyId(input.partyId);

	if(!party.roles){
		party.roles = [];
	}

	party.roles.forEach(role => {
		if(role === input.role){
			throw { name: customError.BAD_REQUEST_ERROR, message: `This party is already in the ${role} role` };	
		}
	});

	party.roles.push(input.role);

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}
	
	return {
		status : "SUCCESS",
		message: `Added ${input.role} role to party(${party._id})`,
		party: party
	};
}

async function editPicture(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		picture: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	partyHelper.validatePictureInput(input.picture);

	let party = await partyHelper.validatePartyId(input.partyId);

	//hold the old picture object, incase we need to rollback
	const oldPicture = {...party.picture}

	party.picture = input.picture;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyPicture";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit picture");
		
		party.picture = oldPicture;
		try{
			party = await party.save();
		}catch(error){
			logger.error("party.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		editPartyPictureEventMsg: party
	};
}

async function editContact(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		contact: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	partyHelper.validateContactInput(input.contact, false);
	
	let party = await partyHelper.validatePartyId(input.partyId);

	//hold the old contact object, incase we need to rollback
	const oldContact = {...party.contact}

	party.contact = input.contact;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyContact";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit contact");
		
		party.contact = oldContact;
		try{
			party = await party.save();
		}catch(error){
			logger.error("party.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		editPartyContactEventMsg: party
	};
}

async function editPersonalInfo(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	partyHelper.validatePersonalInfoInput(input.personalInfo, false);
	
	let party = await partyHelper.validatePartyId(input.partyId);

	//hold the old personalInfo object, in case we need to roll back
	const oldPersonalInfo = {...party.personalInfo};

	party.personalInfo = input.personalInfo;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyPersonalInfo";
	utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back edit personalInfo");
		
		party.personalInfo = oldPersonalInfo;
		try{
			party = await party.save();
		}catch(error){
			logger.error("party.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
		}
	});

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		editPartyPersonalInfoEventMsg: party
	};
}

async function changePreferredLanguage(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		language: Joi
			.string()
			.valid("zh-Hans","zh-Hant","en")
			.required()
	});
	utility.validateInput(schema, input);
	
	let party = await partyHelper.validatePartyId(input.partyId);

	party.preferredLanguage = input.preferredLanguage;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	return {
		status : "SUCCESS",
		message: `Changed preferredLanguage to ${input.language}`,
		party: party
	};
}

async function changePreferredContactMethod(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		contactMethod: Joi
			.string()
			.valid("SMS","EMAIL","WHATSAPP")
			.required()
	});
	utility.validateInput(schema, input);
	
	let party = await partyHelper.validatePartyId(input.partyId);

	party.preferredContactMethod = input.preferredContactMethod;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	return {
		status : "SUCCESS",
		message: `Changed preferredContactMethod to ${input.contactMethod}`,
		party: party
	};
}

async function updateUserId(input, user){
    const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		userId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let party = await partyHelper.validatePartyId(input.partyId);

	party.userId = input.userId;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}
	
	return {
		status : "SUCCESS",
		message: `Updated userId(${party.userId})`,
		party: party
	};
}

async function createNewParty(input, user){
	const schema = Joi.object({
		userId: Joi
			.string()
			.min(1)
			.allow(null),
		personalInfo: Joi
			.object()
			.required(),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null),
		role: Joi
			.string()
			.valid("ADMIN","STAFF","CREW","CUSTOMER",null),
		preferredContactMethod: Joi
			.string()
			.valid("EMAIL","SMS","WHATSAPP",null),
		preferredLanguage: Joi
			.string()
			.valid("zh-Hans","zh-Hant","en",null)
	});
	utility.validateInput(schema, input);

	partyHelper.validatePersonalInfoInput(input.personalInfo);
	
	if(input.contact){
		partyHelper.validateContactInput(input.contact);

		//TODO check if existing emailAddress or telephoneNumber
	}

	if(input.picture)
		partyHelper.validatePictureInput(input.picture);

	const partyId = uuid.v4();

	let party = new Party();
	party.creationTime = new Date();
    party.lastUpdateTime = new Date();

	party.userId = input.userId;

	party.personalInfo = input.personalInfo;

	if(input.contact){
		party.contact = input.contact;
	}

	if(input.picture)
		party.picture = input.picture;

	if(input.role){
		party.roles = [];
		party.roles.push(input.role);	
	}

	party.preferredContactMethod = input.preferredContactMethod;
	party.preferredLanguage = input.preferredLanguage;

    try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "newParty";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back new party");
		
		try{
			await Party.findOneAndDelete({ _id: party._id });
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		newPartyEventMsg: party
	};
}

async function deleteParty(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	const party = await partyHelper.validatePartyId(input.partyId);

	try {
		await Party.findOneAndDelete({ _id: party._id });
	} catch (error) {
		logger.error("Party.findOneAndDelete() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Party Error" };
	}

	const eventQueueName = "deleteParty";
	utility.publishEvent(party, eventQueueName, user);

	return { 
		status: "SUCCESS",
		message: `Deleted Party(${party._id})`,
		deletePartyEventMsg: party
	}
}

async function readParty(input, user){
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let targetParty;
	try {
		targetParty = await Party.findById(input.partyId);
	} catch (error) {
		logger.error("Party.findById Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyHelper.partyToOutputObj(targetParty);
}

async function readParties(input, user){
	const schema = Joi.object({
		name: Joi
            .string()
            .min(1)
	});
	utility.validateInput(schema, input);

	let searchCriteria;
	if (input.name) {
		searchCriteria = {
			"name": input.name
		}
	}

	let parties;
	try {
		parties = await Party.find(searchCriteria);
	} catch (error) {
		logger.error("Party.find Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	var outputObjs = [];
	parties.forEach((item) => {
		outputObjs.push(partyHelper.partyToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"parties": outputObjs
	};
}

module.exports = {
    createNewParty,
	deleteParty,
	editPersonalInfo,
	editContact,
	editPicture,
	addRole,
	removeRole,
	sendMessage,
	sendRegistrationInvite,
	changePreferredContactMethod,
	changePreferredLanguage,
	readParty,
    readParties,
	updateUserId
}