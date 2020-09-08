const jwt = require("jsonwebtoken");

const occupancyService = require("../occupancy/occupancy.service");
const customError = require("../common/customError");

async function getOccupancies(startTime, endTime, assetId) {
	var user = new Object();
	jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
		if (err) {
			reject({ name: customError.JWT_ERROR, message: err.message });
		} else {
			user = targetUser;
		}
	});

	const input = {
		"startTime": startTime,
		"endTime": endTime,
		"assetId": assetId
	}

	try {
		return await occupancyService.getOccupancies(input, user); 
	} catch (err) {
		logger.error("occupancyService.getOccupancies error : ", err);
		throw err;
	}
}

module.exports = {
	getOccupancies
}