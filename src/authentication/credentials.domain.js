"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Credentials} = require("./authentication.model");

async function createCredentials(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
		provider: Joi.string(),
        providerUserId: Joi.string(),
        loginId: Joi.string(),
        password: Joi.string()
	});
	utility.validateInput(schema, input);

    let credentials = new Credentials();

    credentials.userId = input.userId;

    if(input.providerUserId){
        credentials.provider = input.provider;
        credentials.providerUserId = input.providerUserId;
    }
    
    if(input.loginId){
        credentials.loginId = input.loginId;
        credentials.password = input.password;
    }
    
    try{
        credentials = await credentials.save()
    }catch(error){
        logger.error("credentials.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Credentials Error" };
    }

    return credentials;
}

async function readCredentialsByProviderUserId(provider, providerUserId){
    let credentials;
    try{
        credentials = await Credentials.findOne({provider: provider, providerUserId: providerUserId});
    }catch(error){
        logger.error("Credentials.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Credentials Error" };
    }

    return credentials;
}

async function readCredentialsByLoginId(loginId, password){
    let credentials;
    try{
        credentials = await Credentials.findOne({loginId: loginId, password: password});
    }catch(error){
        logger.error("Credentials.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Credentials Error" };
    }

    return credentials;
}

async function deleteCredentials(userId){
    try{
        await Credentials.findOneAndDelete({userId: userId});
    }catch(error){
        logger.error("credentials.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Credentials Error" };
    }

    return;
}

async function deleteAllCredentialses(){
    try{
        await Credentials.deleteMany();
    }catch(error){
        logger.error("credentials.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Credentials Error" };
    }

    return;
}

module.exports = {
	createCredentials,
    readCredentialsByProviderUserId,
    readCredentialsByLoginId,
    deleteCredentials,
    deleteAllCredentialses
}