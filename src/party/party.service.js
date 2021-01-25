const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const Party = require("./party.model").Party;
const profileHelper = require("../common/profile/profile.helper");

async function getTargetParty(partyId){
	//validate partyId
	if (mongoose.Types.ObjectId.isValid(partyId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//get target party
	let targetParty;
	try {
		targetParty = await Party.findById(partyId);
	} catch (err) {
		logger.error("Party.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetParty == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid partyId" };
	}

	return targetParty;
}

async function saveParty(party){
	try{
		party = await party.save();
	}catch(err){
		logger.err("party.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyToOutputObj(party);	
}

async function editPicture(input, user){
	//validate input data
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

	//validate picture input
	profileHelper.validatePictureInput(input.contact, false);
	
	//get target party
	let targetParty = await getTargetParty(input.partyId);

	//set picture attributes
	targetParty = profileHelper.setPicture(input.picture, targetParty);

	//save to db
	return saveParty(targetParty);	
}

async function editContact(input, user){
	//validate input data
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

	//validate contact input
	profileHelper.validateContactInput(input.contact, false);
	
	//get target party
	let targetParty = await getTargetParty(input.partyId);

	//instantiate old contact incase we need to rollback
	const oldContact = Object.assign({}, targetParty.contact);

	//set contact attributes
	targetParty = profileHelper.setContact(input.contact, targetParty);

	//save to db
	targetParty = await saveParty(targetParty);

	//publish edit targetParty.contact event
	try{
		utility.publishEvent(targetParty, "editPartyPersonalInfo");
	}catch(error){
		console.log(error);
		logger.err("utility.publishEvent error : ", error);

		//rolling back contact
		targetParty = profileHelper.setContact(oldContact, targetParty);
		await saveParty(targetParty);

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetParty;
}

async function editPersonalInfo(input, user){
	//validate input data
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

	//set personalInfo.nameRequired = false because this is only editing
	//maybe only editing birthday or gender
	input.personalInfo.nameRequired = false;

	//validate personalInfo input
	profileHelper.validatePersonalInfoInput(input.personalInfo);
	
	//get target party
	let targetParty = await getTargetParty(input.partyId);

	//instantiate old personalInfo incase we need to rollback
	const oldPersonalInfo = Object.assign({}, targetParty.personalInfo);

	//set personalInfo attributes
	targetParty = profileHelper.setPersonalInfo(input.personalInfo, targetParty);

	//save to db
	targetParty = await saveParty(targetParty);

	//publish edit party personal info event
	try{
		utility.publishEvent(targetParty, "editPartyContact");
	}catch(error){
		console.log(error);
		logger.err("utility.publishEvent error : ", error);

		//rolling back personalInfo
		targetParty = profileHelper.setPersonalInfo(oldPersonalInfo, targetParty);
		await saveParty(targetParty);

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return targetParty;
}

async function findParty(input, user){
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

	return partyToOutputObj(targetParty);
}

async function deleteParty(input, user) {
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

async function searchParty(input, user){
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
		outputObjs.push(partyToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"parties": outputObjs
	};
}

async function createNewParty(input, user){
	//validate input data
	const schema = Joi.object({
		personalInfo: Joi
			.object()
			.required(),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null)
		
	});
	utility.validateInput(schema, input);

	let party = new Party();

	//validate and set personalInfo
	profileHelper.validatePersonalInfoInput(input.personalInfo);
	party = profileHelper.setPersonalInfo(input.personalInfo, party);

	//validate and contact
	if(input.contact != null){
		profileHelper.validateContactInput(input.contact);
		party = profileHelper.setContact(input.contact, party);
	}
	
	//validate and picture
	if(input.picture != null){
		profileHelper.validatePictureInput(input.picture);
		party = profileHelper.setPicture(input.picture, party);
	}

	//save to db
	return saveParty(party);
}

function partyToOutputObj(party){
    let outputObj = new Object();
	outputObj.id = party._id.toString();

	outputObj.personalInfo = party.personalInfo;
	
	if(party.contact.telephoneNumber != null || party.contact.emailAddress != null){
		outputObj.contact = party.contact;
	}
	
	if(party.picture.url != null){
		outputObj.picture = party.picture;
	}
    
    return outputObj;
}


module.exports = {
    createNewParty,
	searchParty,
	deleteParty,
	findParty,
	editPersonalInfo,
	editContact,
	editPicture
}