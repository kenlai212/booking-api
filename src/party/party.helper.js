const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Party} = require("./party.model");

function partyToOutputObj(party){
    let outputObj = new Object();
	outputObj.id = party._id.toString();

	if(party.userId){
		outputObj.userId = party.userId;
	}
	
	if(party.personalInfo){
		outputObj.personalInfo = new Object();

		if(party.personalInfo.name)
			outputObj.personalInfo.name = party.personalInfo.name;

		if(party.personalInfo.dob)
			outputObj.personalInfo.dob = party.personalInfo.dob;

		if(party.personalInfo.gender)
			outputObj.personalInfo.gender = party.personalInfo.gender;
	}
	
	if(party.contact){
		outputObj.contact = new Object();

		if(party.contact.emailAddress)
			outputObj.contact.emailAddress = party.contact.emailAddress;

		if(party.contact.telephoneCountryCode)
			outputObj.contact.telephoneCountryCode = party.contact.telephoneCountryCode;

		if(party.contact.telephoneNumber)
			outputObj.contact.telephoneNumber = party.contact.telephoneNumber;
	}

	if(party.picture){
		outputObj.picture = new Object();

		if(party.picture.url)
			outputObj.picture.url = party.picture.url;
	}

	if(party.roles)
		outputObj.roles = party.roles;

	if(party.preferredContactMethod){
		outputObj.preferredContactMethod = party.preferredContactMethod;
	}
	
	if(party.preferredLanguage){
		outputObj.preferredLanguage = party.preferredLanguage;
	}
	
    return outputObj;
}

function getContactMethod(party){
	if(!party.contact || (!party.contact.emailAddress && !party.contact.telephoneNumber)){
		throw { name: customError.BAD_REQUEST_ERROR, message: `No contact method available` };
	}

	let contactMethod;
	if(party.preferredContactMethod){
		contactMethod = party.preferredContactMethod;
	}else{
		if(party.contact.telephoneNumber){
			contactMethod = "SMS";
		}else{
			contactMethod = "EMAIL"
		}
	}

	return contactMethod;
}

async function validatePartyId(partyId){
	let targetParty;
	try {
		targetParty = await Party.findById(partyId);
	} catch (err) {
		logger.error("Party.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Party Error" };
	}

	if (!targetParty)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid partyId" };

	return targetParty;
}

function validatePersonalInfoInput(input, nameRequired){
	const schema = Joi.object({
		name: Joi
            .string()
			.min(1)
			.allow(null),
		dob: Joi
			.date()
			.iso()
			.allow(null),
		utcOffset: Joi
			.number()
			.when("dob",{not: null, then: Joi.required()}),
		gender: Joi
			.string()
			.valid("MALE", "FEMALE")
			.allow(null)
	});
	utility.validateInput(schema, input);

	if(nameRequired && !input.name)
		throw { name: customError.BAD_REQUEST_ERROR, message: "name is mandatory"};
}

function validateContactInput(input){
	const schema = Joi.object({
		telephoneNumber: Joi
			.string()
			.min(1)
			.allow(null),
		telephoneCountryCode: Joi
			.string()
			.min(1)
			.valid("852","853","82",null)
			.when("telephoneNumber", { not: null, then: Joi.required() }),
		emailAddress: Joi
			.string()
			.min(1)
			.allow(null),
		pictureUrl: Joi
			.string()
			.min(1)
			.allow(null)
	});
	utility.validateInput(schema, input);
}

function validatePictureInput(input){
	const schema = Joi.object({
		url: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);
}

module.exports = {
    validatePartyId,
	validatePersonalInfoInput,
	validateContactInput,
	validatePictureInput,
	getContactMethod,
	partyToOutputObj
}