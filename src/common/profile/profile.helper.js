const Joi = require("joi");

const Contact = require("./profile.class").Contact;
const Picture = require("./profile.class").Picture;

function validateProfileInput(profileInput, nameRequired){
	
	if(nameRequired == true && (profileInput.name == null || profileInput.name.length == 0)){
		throw "name is mandatory";
	}

	//validate input data
	const schema = Joi.object({
		name: Joi
            .string()
			.min(1)
			.allow(null),
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
	
	const result = schema.validate(profileInput);
	
	if (result.error) {
		throw result.error.details[0].message.replace(/\"/g, '');
	}
}

function setProfile(profileInput, party){
	//set name
	if(profileInput.name != null && profileInput.name.length > 0){
		party.name = profileInput.name;
	}

	//set telephoneNumber
	if(profileInput.telephoneNumber != null && profileInput.telephoneNumber.length > 0){
		if(profileInput.telephoneCountryCode == null || profileInput.telephoneCountryCode.length == 0){
			throw { name: customError.BAD_REQUEST_ERROR, message: "telephoneCountryCode is mandatory" };
		}
		
		if(party.contact == null){
			party.contact = new Contact();
		}
		
		party.contact.telephoneCountryCode = profileInput.telephoneCountryCode;
		party.contact.telephoneNumber = profileInput.telephoneNumber;
	}

	//set emailAddress
	if(profileInput.emailAddress!=null && profileInput.emailAddress.length > 0){
		if(party.contact == null){
			party.contact = new Contact();
		}

		party.contact.emailAddress = profileInput.emailAddress;
	}

	//set picture
	if(profileInput.pictureUrl != null && profileInput.pictureUrl.length > 0){
		if(party.picture == null){
			party.picture = new Picture();
		}

		party.picture.url = profileInput.pictureUrl;
	}

	return party;
}

module.exports = {
    validateProfileInput,
	setProfile
}