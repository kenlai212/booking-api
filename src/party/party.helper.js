const Joi = require("joi");

const utility = require("../common/utility");
const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const {Party} = require("./party.model");

async function validatePartyId(partyId){
	let targetParty;
	try {
		targetParty = await Party.findById(partyId);
	} catch (err) {
		logger.error("Party.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
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
	validatePictureInput
}