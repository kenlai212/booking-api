"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const claimDomain = require("./claim.domain");
const claimHelper = require("./claim.helper");

async function newClaim(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
		personId: Joi.string().required(),
        userStatus: Joi.string().required(),
        groups: Joi.array().items(Joi.string()),
        roles: Joi.array().items(Joi.string())
	});
	utility.validateInput(schema, input);

    let existingClaim;
    try{
        existingClaim = await claimDomain.readClaim(input.userId);
    }catch(error){
        if(error.name === customError.INTERNAL_SERVER_ERROR)
        throw error;
    }

    if(existingClaim)
    throw { name: customError.BAD_REQUEST_ERROR, message: "Claim already exist for this user" };

    let newClaimInput = new Object();
    newClaimInput.userId = input.userId;
    newClaimInput.personId = input.personId;

    claimHelper.validateUserStatus(input.userStatus);
    newClaimInput.userStatus = input.userStatus;
    
    if(input.groups){
        newClaimInput.groups = [];

        input.groups.forEach(group => {
            claimHelper.validateGroup(group)
            newClaimInput.groups.push(group);
        });
    }

    if(input.roles){
        newClaimInput.roles = [];

        input.roles.forEach(role => {
            claimHelper.validateRole(role)
            newClaimInput.roles.push(role);
        });
    }

    const claim = await claimDomain.createClaim(newClaimInput);
    
    logger.info(`Added new Claim(userId:${claim.userId})`);
    
    return claimHelper.claimToOutputObject(claim); 
}

async function findClaim(input){
    const schema = Joi.object({
        userId: Joi.string().required()
	});
	utility.validateInput(schema, input);


}

async function updateStatus(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
        userStatus: Joi.string().min(1).required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateUserStatus(input.userStatus);

    let claim = await claimDomain.readClaim(input.userId);

    claim.userStatus = input.userStatus;

    claim = await claimDomain.updateClaim(claim);

    logger.info(`Updated status for Claim(userId:${input.userId})`);

    return claimHelper.claimToOutputObject(claim);
}

async function addGroup(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
        group: Joi.string().required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateGroup(input.group);

    let claim = await claimDomain.readClaim(input.userId);

    if(!claim.groups)
    claim.groups = [];

    claim.groups.forEach(group => {
        if(group === input.group)
        throw { name: customError.BAD_REQUEST_ERROR, message: `Claim(userId:${input.userId}) alerady belong to Group(${input.group})` };
    });

    claim.groups.push(input.group);

    claim = await claimDomain.updateClaim(claim);

    logger.info(`Added role(${input.role}) Claim(userId:${input.userId})`);

    return claimHelper.claimToOutputObject(claim);
}

async function removeGroup(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
        group: Joi.string().required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateGroup(input.group);

    let claim = await claimDomain.readClaim(input.userId);

	let groupFound = false;
	if (claim.groups && claim.groups.length > 0) {
		claim.groups.forEach((group, index, object) => {
			if (group === input.group) {
				groupFound = true;
				object.splice(index, 1);
			}
		});
	}
	
	if (!groupFound)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Group(${input.group}) not found for this Claim(userId:${input.userId})` };

    claim = await claimDomain.updateClaim(claim);

    logger.info(`Removed role(${input.role}) form Claim(userId:${input.userId})`);

    return claimHelper.claimToOutputObject(claim);
}

async function addRole(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
        role: Joi.string().required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateRole(input.role);

    let claim = await claimDomain.readClaim(input.userId);

    if(!claim.roles)
    claim.roles = [];

    claim.roles.forEach(role => {
        if(role === input.role)
        throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Claim(userId:${input.userId}) alerady has Role(${input.role})` };
    })

    claim.roles.push(input.role);

    claim = await claimDomain.updateClaim(claim);

    logger.info(`Added role(${input.role}) to Claim(userId:${input.userId})`);

    return claimHelper.claimToOutputObject(claim);
}

async function removeRole(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
        role: Joi.string().required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateRole(input.role);

    let claim = await claimDomain.readClaim(input.userId);

	let roleFound = false;
	if (claim.roles && claim.roles.length > 0) {
		claim.roles.forEach((role, index, object) => {
			if (role === input.role) {
				roleFound = true;
				object.splice(index, 1);
			}
		});
	}
	
	if (!roleFound)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Role(${input.role}) not found for this claim(userId:${input.userId})` };

    claim = await claimDomain.updateClaim(claim);

    logger.info(`Removed role(${input.role}) form Claim(userId:${input.userId})`);

    return claimHelper.claimToOutputObject(claim);
}

async function findClaim(input){
    const schema = Joi.object({
        userId: Joi.string().required(),
	});
    utility.validateInput(schema, input);

    let claim = await claimDomain.readClaim(input.userId);
    
    return claimHelper.claimToOutputObject(claim);
}

async function deleteClaim(input){
    const schema = Joi.object({
        userId: Joi.string().required()
	});
    utility.validateInput(schema, input);

    await claimDomain.deleteClaim(input.userId);

    logger.info(`Deleted Claim(userId:${input.userId})`);

    return {status: "SUCCESS"}
}

async function deleteAllClaims(input){
    const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await claimDomain.deleteAllClaims();

	return {status: "SUCCESS"}
}

module.exports = {
	newClaim,
    findClaim,
    updateStatus,
    addGroup,
    removeGroup,
    addRole,
    removeRole,
    findClaim,
    deleteClaim,
    deleteAllClaims
}