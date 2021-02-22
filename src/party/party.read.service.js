const Joi = require("joi");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const utility = require("../common/utility");

const {Party} = require("./party.model");
const partyHelper = require("./party.helper");

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
	} catch (err) {
		logger.error("Party.findById Error : ", err);
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
    readParty,
    readParties
}