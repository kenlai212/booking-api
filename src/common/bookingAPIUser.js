const jwt = require("jsonwebtoken");

const utility = require("./utility");
const {logger} = utility;

const userObject = {
	id: "BOOKING_SYSTEM",
	name: "Booking API System User",
	groups: [
		"AUTHENTICATION_ADMIN",
		"BOOKING_ADMIN",
		"PRICING_USER",
		"OCCUPANCY_ADMIN",
		"NOTIFICATION_USER",
		"USER_ADMIN",
		"ASSET_ADMIN",
		"STAFF_ADMIN",
		"PERSON_ADMIN",
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