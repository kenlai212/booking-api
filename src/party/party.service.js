const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const Party = require("./party.model").Party;
const profileHelper = require("../common/profile/profile.helper");

async function editProfile(input, user){
	//validate input data
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required(),
		profile: Joi
			.object()
			.required()
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate profile input
	try{
		profileHelper.validateProfileInput(input.profile, false);
	}catch(error){
		console.log(error);
		throw { name: customError.BAD_REQUEST_ERROR, message: error };
	}
	
	//validate partyId
	if (mongoose.Types.ObjectId.isValid(input.partyId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//get target party
	let targetParty;
	try {
		targetParty = await Party.findById(input.partyId);
	} catch (err) {
		logger.error("Party.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetParty == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//set profile attributes
	targetParty = profileHelper.setProfile(input.profile, targetParty);

	//save to db
	try{
		targetParty = await targetParty.save();
	}catch(err){
		logger.err("targetParty.save error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return partyToOutputObj(targetParty);
}

async function getParty(input, user){
	//validate input data
	const schema = Joi.object({
		partyId: Joi
			.string()
			.min(1)
			.required()
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate partyId
	if (mongoose.Types.ObjectId.isValid(input.partyId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//get target party
	let targetParty;
	try {
		targetParty = await Party.findById(input.partyId);
	} catch (err) {
		logger.error("Crew.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetParty == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

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
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate partyId
	if (mongoose.Types.ObjectId.isValid(input.partyId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

	//get target party
	let targetParty;
	try {
		targetParty = await Party.findById(input.partyId);
	} catch (err) {
		logger.error("Crew.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetParty == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid partyId" };
	}

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

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

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
	//validate profile input
	try{
		profileHelper.validateProfileInput(input, true);
	}catch(err){
		throw { name: customError.BAD_REQUEST_ERROR, message: err };
	}
	
	//set profile attributes
	let party = new Party();
	party = profileHelper.setProfile(input, party);

	//save to db
	try {
		party = await party.save();
	} catch (err) {
		logger.error("party.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
    
	return partyToOutputObj(party);
}

function partyToOutputObj(party){
    let outputObj = new Object();
	outputObj.id = party._id.toString();
	outputObj.name = party.name
	
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
	getParty,
	editProfile
}