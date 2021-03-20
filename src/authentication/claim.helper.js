"use strict";
const utility = require("../common/utility");
const {logger, customError} = utility;

const {Claim} = require("./claim.model");

async function findClaim(userId){
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

async function saveClaim(claim){
    try{
        claim = await claim.save();
    }catch(error){
        logger.error("claim.save error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Claim Error" };
    }

    return claim;
}

module.exports = {
	findClaim,
    saveClaim
}