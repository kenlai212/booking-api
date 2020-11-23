"use strict";
const guestService = require("./booking.guest.service");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");

const removeGuest = asyncMiddleware(async (req) => {
	return await guestService.removeGuest(req.params, req.user);
});

const addGuest = asyncMiddleware(async (req) => {
	return await guestService.addGuest(req.body, req.user);
});

const editGuest = asyncMiddleware(async (req) => {
	return await guestService.editGuest(req.body, req.user);
});

module.exports = {
	addGuest,
	removeGuest,
	editGuest
}
