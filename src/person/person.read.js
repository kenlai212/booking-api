const Joi = require("joi");

const utility = require("../common/utility");

const personDomain = require("./person.domain");
const personHelper = require("./person.helper");

async function readPerson(input){
	const schema = Joi.object({
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	return personHelper.personToOutputObj(person);
}

async function readPersons(input){
	const schema = Joi.object({
		name: Joi.string()
	});
	utility.validateInput(schema, input);

	let persons = [];

	if(input.name)
	persons = await personDomain.readPersonsByName(input.name);
	else
	persons = await personDomain.readPersons();

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