"use strict";
const disclaimerService = require("./booking.guest.disclaimer.service");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");

const sendDisclaimerNotification = asyncMiddleware(async (req) => {
	return await disclaimerService.sendDisclaimer(req.body, req.user);
});

const signDisclaimer = asyncMiddleware(async (req) => {
	return await disclaimerService.signDisclaimer(req.body);
});

module.exports = {
	sendDisclaimerNotification,
	signDisclaimer
}