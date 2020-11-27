"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const registrationService = require("./registration.service");

const register = asyncMiddleware(async (req) => {
	return await registrationService.register(req.body);
});

const socialRegister = asyncMiddleware(async (req) => {
	return await registrationService.socialRegister(req.body);
});

module.exports = {
	socialRegister,
	register
}