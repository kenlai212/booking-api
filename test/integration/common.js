const jwt = require("jsonwebtoken");

function getAccessToken() {
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
			"STAFF_ADMIN",
			"PERSON_ADMIN",
			"CUSTOMER_ADMIN",
			"INVOICE_ADMIN"]
	}

	try {
		return jwt.sign(userObject, "azize-lights");
	} catch (err) {
		console.error(err);
		console.error("Error while signing access token for Booking API System User", err);
		throw err;
	}
}

const REQUEST_CONFIG = {headers:{'Authorization': `token ${getAccessToken()}`}}
const DOMAIN_URL = "http://localhost";

module.exports = {
	REQUEST_CONFIG,
	DOMAIN_URL
}