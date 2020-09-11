const bookngAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

async function getOccupancies(startTime, endTime, assetId) {
	const input = {
		"startTime": startTime,
		"endTime": endTime,
		"assetId": assetId
	}

	try {
		return await occupancyService.getOccupancies(input, bookngAPIUser.userObject); 
	} catch (err) {
		logger.error("occupancyService.getOccupancies error : ", err);
		throw err;
	}
}

module.exports = {
	getOccupancies
}