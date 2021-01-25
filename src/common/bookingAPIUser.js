const jwt = require("jsonwebtoken");
const logger = require("./logger");

const userObject = {
	id: "BOOKING_SYSTEM",
	name: "Booking API System User",
	groups: [
		"BOOKING_ADMIN",
		"PRICING_USER",
		"OCCUPANCY_ADMIN",
		"NOTIFICATION_USER",
		"USER_ADMIN",
		"ASSET_ADMIN",
		"CREW_ADMIN",
		"PARTY_ADMIN",
		"CUSTOMER_ADMIN",
		"INVOICE_ADMIN"]
}

function getAccessToken() {
	try {
		return jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET);
	} catch (err) {
		logger.error("Error while signing access token for Booking API System User", err);
		throw err;
	}
}

module.exports = {
	userObject,
	getAccessToken
}