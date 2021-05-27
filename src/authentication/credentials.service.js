"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const credentialsDomain = require("./credentials.domain");
const authenticationHelper = require("./authentication.helper");

async function newCredentials(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
		provider: Joi.string(),
        providerUserId: Joi.string(),
        loginId: Joi.string(),
        password: Joi.string()
	});
	utility.validateInput(schema, input);

    if(!input.providerUserId && !input.loginId)
    throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide providerUserId or loginId" };

    //check for existing credentials for this userID
    let existingCredentials;

    try{
        existingCredentials = await credentialsDomain.readCredentials(input.userId);
    }catch(error){
        if(error.name === customError.INTERNAL_SERVER_ERROR)
        throw error
    }

    if(existingCredentials)
    throw { name: customError.BAD_REQUEST_ERROR, message: "This userId already has credentials" };

    //create new credentials
    let createCredentialsInput = new Object();
    createCredentialsInput.userId = input.userId;

    if(input.providerUserId){
        if(!input.provider)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide provider" };
    
        authenticationHelper.validateProvider(input.provider);

        createCredentialsInput.provider = input.provider;
        createCredentialsInput.providerUserId = input.providerUserId;
    }

    if(input.loginId){
        if(!input.password)
        throw { name: customError.BAD_REQUEST_ERROR, message: "password is mandatory" };

        createCredentialsInput.loginId = input.loginId;
        createCredentialsInput.password = input.password;
    }

    let credentials = await credentialsDomain.createCredentials(createCredentialsInput);

    logger.info(`Added new Credentials(userId:${input.userId})`);

    return credentials;
}

async function readCredentials(input){
    const schema = Joi.object({
        userId: Joi.string(),
		provider: Joi.string(),
        providerUserId: Joi.string(),
        loginId: Joi.string(),
        password: Joi.string()
	});
	utility.validateInput(schema, input);

    let credentials;
    if(input.userId){
        credentials = await credentialsDomain.readCredentials(input.userId);
    }else if(input.providerUserId){
        credentials = await credentialsDomain.readCredentialsByProviderUserId(input.provider, input.providerUserId);
    }else if(input.loginId){
        credentials = await credentialsDomain.readCredentialsByLoginId(input.loginId, input.password);
    }

    if(!credentials)
    throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "No Credentials Found" };

    return credentials;
}

async function deleteCredentials(input){
    const schema = Joi.object({
        userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    await credentialsDomain.deleteCredentials(input.userId);

    logger.info(`Deleted Credentials(userId:${input.userId})`);

    return {status: "SUCCESS"}
}

async function deleteAllCredentialses(input){
    const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await credentialsDomain.deleteAllCredentialses();

	return {status: "SUCCESS"}
}

module.exports = {
	newCredentials,
    readCredentials,
	deleteCredentials,
	deleteAllCredentialses
}