"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const authenticationService = require("../authentication/authentication.service");

async function register(input){
    const schema = Joi.object({
		userId: Joi.string().required(),
		userStatus: Joi.string().required(),
		personId: Joi.string().required(),
		loginId: Joi.string(),
		password: Joi.string(),
		provider: Joi.string(),
		providerToken: Joi.string(),
		groups: Joi.array().items(Joi.string()),
        roles: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

    return await authenticationService.register(input);
}

module.exports = {
	register
}