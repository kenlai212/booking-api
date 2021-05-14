"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const manifestService = require("./manifest.service");

const newManifest = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, ["BOOKING_ADMIN"]);

	return await manifestService.newManifest(req.body);
});

const removeGuest = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		"BOOKING_ADMIN",
		"BOOKING_USER"
	]);

	return await manifestService.removeGuest(req.body);
});

const addGuest = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		"BOOKING_ADMIN",
		"BOOKING_USER"
	]);

	return await manifestService.addGuest(req.body);
});

module.exports = {
	addGuest,
	removeGuest,
	newManifest
}
