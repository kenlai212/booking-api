"use strict";
const utility = require("../common/utility");
const {customError} = utility;

const validGroupIds = [
    "BOOKING_ADMIN",
    "BOOKING_USER",
    "PRICING_USER",
    "OCCUPANCY_ADMIN",
    "NOTIFICATION_USER",
    "USER_ADMIN",
    "ASSET_ADMIN",
    "ASSET_USER",
    "CREW_ADMIN",
    "CREW_USER",
    "PARTY_ADMIN"
]

function validateGroupId(groupId){
    if(!validGroupId.includes(groupId))
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid groupId" };
}

module.exports = {
    validGroupIds,
	validateGroupId
}