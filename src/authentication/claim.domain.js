"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Claim} = require("./authentication.model");

async function createClaim(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
		personId: Joi.string().required(),
        userStatus: Joi.string().required(),
        groups: Joi.array().items(Joi.string()),
        roles: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

    let claim = new Claim();
    claim.userId = input.userId;
    claim.personId = input.personId;
    claim.userStatus = input.userStatus;
    
    if(input.groups)
    claim.groups = input.groups;

    if(input.roles)
    claim.roles = input.roles;

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
        throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid userId" };

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

async function deleteClaim(userId){
    try{
        await Claim.findOneAndDelete({userId: userId});
    }catch(error){
        logger.error("claim.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Claim Error" };
    }

    return;
}

async function deleteAllClaims(){
    try{
        await Claim.deleteMany();
    }catch(error){
        logger.error("claim.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Claim Error" };
    }

    return;
}

module.exports = {
	createClaim,
    readClaim,
    updateClaim,
    deleteClaim,
    deleteAllClaims
}