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

function toOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user._id.toString();
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.userType = user.userType;
	outputObj.lastLoginTime = user.lastLoginTime;
	
	if (user.groups != null && user.groups.length > 0) {
		outputObj.groups = user.groups;
	}

	outputObj.partyId = user.partyId;
	outputObj.personalInfo = user.personalInfo;

	if(user.contact != null && (user.contact.telephoneNumber != null || user.contact.emailAddress != null)){
		outputObj.contact = user.contact;
	}
	
	if(user.picture != null && user.picture.url != null){
		outputObj.picture = user.picture;
	}
	
	return outputObj;
}

module.exports = {
    validGroupIds,
	validateGroupId,
    toOutputObj
}