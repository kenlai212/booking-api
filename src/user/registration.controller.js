"use strict";

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const registrationService = require("./registration.service");

const invitedSocialRegister = asyncMiddleware(async (req) => {
	return await registrationService.invitedSocialRegister(req.body);
});

const invitedRegister = asyncMiddleware(async (req) => {
	return await registrationService.invitedRegister(req.body);
});

module.exports = {
	invitedSocialRegister,
	invitedRegister
}