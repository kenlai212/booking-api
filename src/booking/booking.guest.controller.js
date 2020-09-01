"use strict";
const guestService = require("./booking.guest.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const removeGuest = asyncMiddleware(async (req) => {
	return await guestService.removeGuest(req.body, req.user);
});

const addGuest = asyncMiddleware(async (req) => {
	return await guestService.addGuest(req.body, req.user);
});

const editGuest = asyncMiddleware(async (req) => {
	return await guestService.editGuest(req.body, req.user);
});

const sendDisclaimer = asyncMiddleware(async (req) => {
	return await guestService.sendDisclaimer(req.body, req.user);
});

const signDisclaimer = asyncMiddleware(async (req) => {
	return await guestService.signDisclaimer(req.body);
});

module.exports = {
	addGuest,
	removeGuest,
	editGuest,
	sendDisclaimer,
	signDisclaimer
}
