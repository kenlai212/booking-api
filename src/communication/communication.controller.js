"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const communicationService = require("./communication.service");

const NOTIFICATION_ADMIN_GROUP = "NOTIFICATION_ADMIN";
const NOTIFICATION_POWER_USER_GROUP = "NOTIFICATION_POWER_USER";
const NOTIFICATION_USER_GROUP = "NOTIFICATION_USER";

const email = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		NOTIFICATION_ADMIN_GROUP,
		NOTIFICATION_POWER_USER_GROUP,
		NOTIFICATION_USER_GROUP
	]);

	return await communicationService.sendEmail(req.body, req.user);
});

const sms = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		NOTIFICATION_ADMIN_GROUP,
		NOTIFICATION_POWER_USER_GROUP,
		NOTIFICATION_USER_GROUP
	]);
	
	return await communicationService.sendSMS(req.body, req.user);
});

module.exports = {
	email,
	sms
}