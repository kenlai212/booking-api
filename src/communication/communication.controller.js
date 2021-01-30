"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const communicationService = require("./communication.service");

const email = asyncMiddleware(async (req) => {
	return await communicationService.sendEmail(req.body, req.user);
});

const sms = asyncMiddleware(async (req) => {
	return await communicationService.sendSMS(req.body, req.user);
});

module.exports = {
	email,
	sms
}