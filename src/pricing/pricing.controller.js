"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const pricingService = require("./pricing.service");

const PRICING_ADMIN_GROUP = "PRICING_ADMIN";
const PRICING_USER_GROUP = "PRICING_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER"

const totalAmount = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		PRICING_ADMIN_GROUP,
		PRICING_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]);

	const queryObject = url.parse(req.url, true).query;
	return await pricingService.calculateTotalAmount(queryObject, req.user)
});

module.exports = {
	totalAmount
}
