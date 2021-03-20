const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Person} = require("./person.model");
const personHelper = require("./person.helper");

async function readPerson(input){
	const schema = Joi.object({
		personId: Joi
			.string()
			.min(1)
			.required()
	});
	utility.validateInput(schema, input);

	let person;
	try {
		person = await Person.findById(input.personId);
	} catch (error) {
		logger.error("Person.findById Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	return personHelper.personToOutputObj(person);
}

async function readPersons(input){
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

	let persons;
	try {
		persons = await Person.find(searchCriteria);
	} catch (error) {
		logger.error("Person.find Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Person Error" };
	}

	var outputObjs = [];
	persons.forEach((item) => {
		outputObjs.push(personHelper.personToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"persons": outputObjs
	};
}

module.exports = {
	readPerson,
    readPersons
}