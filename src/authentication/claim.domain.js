"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Claim} = require("./claim.model");

async function createClaim(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
		personId: Joi.string().min(1).required(),
        provider: Joi.string().min(1).allow(null),
        providerUserId: Joi.string().min(1).allow(null),
        userStatus: Joi.string().min(1).required(),
        groups: Joi.array().items(Joi.string()).allow(null)
	});
	utility.validateInput(schema, input);

    let claim = new Claim();
    claim.userId = input.userId;
    claim.personId = input.personId;

    if(input.provider)
        claim.provider = input.provider;

    if(input.providerUserId)
        claim.providerUserId = input.providerUserId;

    claim.userStatus = input.userStatus;
    
    if(input.groups)
        claim.groups = input.groups;

    try{
        claim = await claim.save();
    }catch(error){
        logger.error("claim.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Claim Error" };
     }
    
     return claim;
}

async function readClaim(userId){
    let claim;
    try{
        claim = await Claim.findOne({userId: userId});
    }catch(error){
        logger.error("Claim.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Claim Error" };
    }

    if(!claim)
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Invalid userId" };

    return claim;
}

async function readClaimByProviderProfile(provider, providerUserId){
    try {
		claim = await Claim.findOne({
			"provider": provider,
			"providerUserId": providerUserId
		});
	} catch (err) {
		logger.error("User.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find User Error" };
	}

    if(!claim)
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Invalid provider profile" };

    return claim;
}

async function updateClaim(claim){
    try{
        claim = await claim.save();
    }catch(error){
        logger.error("claim.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Claim Error" };
    }

    return claim;
}

module.exports = {
	createClaim,
    readClaim,
    readClaimByProviderProfile,
    updateClaim
}