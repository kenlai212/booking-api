"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const registrationService = require("./registration.service");

const socialRegister = asyncMiddleware(async (req) => {
	return await registrationService.socialRegister(req.body);
});

module.exports = {
	socialRegister
}