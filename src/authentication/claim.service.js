"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const {Claim} = require("./claim.model");
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

    return claimHelper.saveClaim(claim);
}

async function updateStatus(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
        userStatus: Joi.string().min(1).required(),
	});
    utility.validateInput(schema, input);

    let claim = claimHelper.findClaim(input.userId);

    claim.userStatus = input.userStatus;

    return claimHelper.saveClaim(claim);
}

async function updateGroups(input){
    const schema = Joi.object({
        userId: Joi.string().min(1).required(),
        groups: Joi.array().items(Joi.string()).required,
	});
    utility.validateInput(schema, input);

    let claim = claimHelper.findClaim(input.userId);

    claim.groups = input.groups;

    return claimHelper.saveClaim(claim);
}

module.exports = {
	newClaim,
    updateStatus,
    updateGroups
}