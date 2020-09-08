const logger = require("../common/logger").logger;
const authenticationService = require("../authentication/authentication.service");

async function addNewCredentials(loginId, password, userId) {
	try {
		return await authenticationService.addNewCredentials({
			loginId: loginId,
			password: password,
			userId: userId
		})
	} catch (err) {
		logger.error("Error while calling authenticationService.addNewCredentials", err);
		throw err;
	}
}

async function checkLoginIdAvailability(loginId) {
	try {
		const result = await authenticationService.checkLoginIdAvailability({ "loginId": loginId });

		return result.isAvailable;
	} catch (err) {
		logger.error("Error while calling authenticationService.checkLoginIdAvailability()", err);
		throw err;
	}
}

module.exports = {
	addNewCredentials,
	checkLoginIdAvailability
}