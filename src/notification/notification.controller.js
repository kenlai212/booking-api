"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const notificationService = require("./notification.service");

const email = asyncMiddleware(async (req) => {
	return await notificationService.sendEmail(req.body, req.user);
});

const sms = asyncMiddleware(async (req) => {
	return await notificationService.sendSMS(req.body, req.user);
});

module.exports = {
	email,
	sms
}

