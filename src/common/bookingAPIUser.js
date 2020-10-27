const jwt = require("jsonwebtoken");
const logger = require("./logger");

const userObject = {
	name: "Booking API System User",
	groups: [
		"BOOKING_ADMIN_GROUP",
		"PRICING_USER_GROUP",
		"OCCUPANCY_ADMIN_GROUP",
		"NOTIFICATION_USER_GROUP",
		"USER_ADMIN_GROUP",
		"ASSET_ADMIN_GROUP"]
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