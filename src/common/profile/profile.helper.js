const Joi = require("joi");
const moment = require("moment");

const customError = require("../customError");
const utility = require("../utility");

const { PersonalInfo } = require("./profile.model");
const { Contact } = require("./profile.model");
const { Picture } = require("./profile.model");

function validatePersonalInfoInput(input){
	const schema = Joi.object({
		name: Joi
            .string()
			.min(1)
			.allow(null),
		nameRequired: Joi
			.boolean()
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

	if(!input.nameRequired)
		input.nameRequired = true;

	if(input.nameRequired && !input.name)
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

function setPersonalInfo(input, party){
	if(!party.personalInfo)
		party.personalInfo = new PersonalInfo();

	//set name
	if(input.name)
		party.personalInfo.name = input.name;
	
	//set dob
	if(input.dob)
		party.personalInfo.dob = moment(input.dob).utcOffset(input.utcOffset).toDate();

	//set gender
	if(input.gender)
		party.personalInfo.gender = input.gender;

	return party;
}

function setContact(input, party){
	if(!party.contact)
		party.contact = new Contact();

	//set telephoneNumber
	if(input.telephoneNumber){
		party.contact.telephoneCountryCode = input.telephoneCountryCode;
		party.contact.telephoneNumber = input.telephoneNumber;
	}

	//set emailAddress
	if(input.emailAddress){
		if(!party.contact)
			party.contact = new Contact();

		party.contact.emailAddress = input.emailAddress;
	}

	return party;
}

function setPicture(input, party){
	if(!party.picture)
		party.picture = new Picture();

	//set picture
	if(input.url)
		party.picture.url = input.url;

	return party;
}

module.exports = {
	validatePersonalInfoInput,
	validateContactInput,
	validatePictureInput,
	setPersonalInfo,
	setContact,
	setPicture
}