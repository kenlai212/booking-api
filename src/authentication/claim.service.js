"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const claimDomain = require("./claim.domain");
const claimHelper = require("./claim.helper");

async function newClaim(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
		personId: Joi.string().min(1).required(),
        provider: Joi.string().min(1).allow(null),
        providerUserId: Joi.string().min(1).allow(null),
        userStatus: Joi.string().min(1).required(),
        groups: Joi.array().items(Joi.string()).allow(null)
	});
	utility.validateInput(schema, input);

    claimHelper.validateUserStatus(input.userStatus);

    let newClaimInput;
    newClaimInput.userId = input.userId;
    newClaimInput.personId = input.personId;

    if(input.provider)
    newClaimInput.provider = input.provider;

    if(input.providerUserId)
    newClaimInput.providerUserId = input.providerUserId;

    newClaimInput.userStatus = input.userStatus;
    
    if(input.groups)
    newClaimInput.groups = input.groups;

    return await claimDomain.createClaim(newClaimInput);
}

async function updateStatus(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
        userStatus: Joi.string().min(1).required(),
	});
    utility.validateInput(schema, input);

    claimHelper.validateUserStatus(input.userStatus);

    let claim = claimDomain.readClaim(input.userId);

    claim.userStatus = input.userStatus;

    return await claimDomain.updateClaim(claim);
}

async function updateGroups(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
        groups: Joi.array().items(Joi.string()).required,
	});
    utility.validateInput(schema, input);

    claimHelper.validateGroup(input.group);

    let claim = claimDomain.readClaim(input.userId);

    claim.groups = input.groups;

    return await claimDomain.updateClaim(claim);
}

module.exports = {
	newClaim,
    updateStatus,
    updateGroups
}