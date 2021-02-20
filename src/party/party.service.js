const Joi = require("joi");
const uuid = require('uuid');

const logger = require("../common/logger").logger;
const utility = require("../common/utility");
const customError = require("../common/customError");

const {Party} = require("./party.model");
const partyHelper = require("./party.helper");

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

	party.picture = input.picture;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyPicture";
	utility.publishEvent(input, eventQueueName, user);

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

	party.contact = input.contact;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyContact";
	utility.publishEvent(input, eventQueueName, user);

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

	party.personalInfo = input.personalInfo;

	try{
		party = await party.save();
	}catch(error){
		logger.error("party.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "editPartyPersonalInfo";
	utility.publishEvent(input, eventQueueName, user);

	return {
		status : "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		editPartyPersonalInfoEventMsg: party
	};
}

async function createNewParty(input, user){
	const schema = Joi.object({
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
			.valid("ADMIN","STAFF","CREW","CUSTOMER",null)
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
	party.id = partyId;
	party.creationTime = new Date();
    party.lastUpdateTime = new Date();

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

    try{
		party = await party.save();
	}catch(err){
		logger.error("party.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Party Error" };
	}

	const eventQueueName = "newParty";
	utility.publishEvent(input, eventQueueName, user);

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`, 
		newPartyEventMsg: party
	};
}

module.exports = {
    createNewParty,
	editPersonalInfo,
	editContact,
	editPicture,
	addRole,
	removeRole
}