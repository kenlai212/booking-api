const moment = require("moment");

const logger = require("../common/logger").logger;
const bookngAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

async function getOccupancies(startTimeIsoStr, endTimeIsoStr, utcOffset, assetId) {
	const input = {
		"startTime": startTimeIsoStr,
		"endTime": endTimeIsoStr,
		"utcOffset": utcOffset,
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