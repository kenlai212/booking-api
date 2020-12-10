"use strict";
const bookingCommon = require("../booking.common");
const customError = require("../../common/customError");
const userAuthorization = require("../../common/middleware/userAuthorization");

const crewService = require("./booking.crew.service");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");

const assignCrew = asyncMiddleware(async (req,) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.assignCrew(req.body, req.user);
});

const relieveCrew = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.relieveCrew(req.params, req.user);
});

module.exports = {
	assignCrew,
	relieveCrew
}
