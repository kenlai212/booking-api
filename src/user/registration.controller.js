"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const registrationService = require("./registration.service");

const USER_ADMIN_GROUP = "USER_ADMIN";

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await personService.sendRegistrationInvite(req.body);
});

const invitedSocialRegister = asyncMiddleware(async (req) => {
	return await registrationService.invitedSocialRegister(req.body);
});

const invitedRegister = asyncMiddleware(async (req) => {
	return await registrationService.invitedRegister(req.body);
});

module.exports = {
	sendRegistrationInvite,
	invitedSocialRegister,
	invitedRegister
}