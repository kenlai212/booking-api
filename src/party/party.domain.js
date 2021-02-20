const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const Party = require("./party.model").Party;
const partyCommon = require("./party.common");

const profileHelper = require("../common/profile/profile.helper");

async function createParty(input, user){
	const schema = Joi.object({
        partyId: Joi
            .string()
            .required(),
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

    let party = new Party();
	party.creationTime = new Date();
    party.lastUpdateTime = new Date();
	party = profileHelper.setPersonalInfo(input.personalInfo, party);

	if(input.contact)
		party = profileHelper.setContact(input.contact, party);

	if(input.picture)
		party = profileHelper.setPicture(input.picture, party);

	if(input.role){
		party.roles = [];
		party.roles.push(input.role);	
	}

    try{
		party = await party.save();
	}catch(err){
		logger.err("party.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyCommon.partyToOutputObj(party);
}

async function readParty(input, user){
	//validate input data
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
	} catch (err) {
		logger.error("Party.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyCommon.partyToOutputObj(targetParty);
}

async function readParties(input, user){
    //validate input data
	const schema = Joi.object({
		name: Joi
            .string()
            .min(1)
	});
	utility.validateInput(schema, input);

	let searchCriteria;
	if (input.status != null) {
		searchCriteria = {
			"name": input.name
		}
	}

	let parties;
	try {
		parties = await Party.find(searchCriteria);
	} catch (err) {
		logger.error("Party.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	parties.forEach((item) => {
		outputObjs.push(partyCommon.partyToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"parties": outputObjs
	};
}

async function updateParty(input, user){
	const schema = Joi.object({
        partyId: Joi
            .string()
            .required(),
		personalInfo: Joi
			.object()
			.allow(null),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null),
		role: Joi
			.string()
			.valid("ADMIN","STAFF","CREW","CUSTOMER",null),
		userId: Joi
			.string()
			.allow(null)
	});
	utility.validateInput(schema, input);

	let targetParty;
	try{
		targetParty = await Party.findById(input.partyId);
	}catch(err){
		logger.err("Party.findById error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(input.personalInfo)
		targetParty.personalInfo = input.personalInfo;

	if(input.contact)
		targetParty = profileHelper.setContact(input.contact, targetParty);

	if(input.picture)
		targetParty.picture = input.picture;

	if(input.role)
		targetParty.role = input.role;

	if(input.userId)
		targetParty.userId = input.userId;

	targetParty.lastUpdateTime = new Date();

	try{
		targetParty = await targetParty.save();
	}catch(err){
		logger.err("targetParty.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyCommon.partyToOutputObj(targetParty);
}

async function deleteParty(input, user){
	//validate input data
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	//get party
	const targetParty = await getTargetParty(input.partyId);

	//delete party record
	try {
		await Party.findByIdAndDelete(targetParty._id.toString());
	} catch (err) {
		logger.error("Party.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return { "status": "SUCCESS" }
}

module.exports = {
    createParty,
    readParty,
    readParties,
	updateParty,
	deleteParty
}