"use strict";
const utility = require("../common/utility");
const {customError} = utility;

function validateUserStatus(userStatus){
    const validUserStatuses = ["ACTIVE", "INACTIVE", "AWAITING_ACTIVATION"]

    if(!validUserStatuses.includes(userStatus))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userStatus" };
}

function validateGroup(group){
    const validGroups = [
        "AUTHENTICATION_ADMIN",
		"BOOKING_ADMIN",
		"PRICING_USER",
		"OCCUPANCY_ADMIN",
		"NOTIFICATION_USER",
		"USER_ADMIN",
		"ASSET_ADMIN",
		"STAFF_ADMIN",
		"PERSON_ADMIN",
		"CUSTOMER_ADMIN",
		"INVOICE_ADMIN"
    ]

    if(!validGroups.includes(group))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid group" };
}

function validateRole(role){
    const validRoles = [
        "CUSTOMER",
        "STAFF",
        "INTERNAL_ADMIN"
    ]

    if(!validRoles.includes(role))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid role" };
}

function claimToOutputObject(claim){
    let outputObj = new Object();

    outputObj.userId = claim.userId;
    outputObj.personId = claim.personId;
    outputObj.userStatus = claim.userStatus;
    outputObj.groups = claim.groups;
    outputObj.roles = claim.roles;

    return outputObj;
}

module.exports = {
    validateUserStatus,
    validateGroup,
    validateRole,
    claimToOutputObject
}