const jwt = require("jsonwebtoken");

const occupancyService = require("../occupancy/occupancy.service");
const customError = require("../errors/customError");

function getOccupancies(startTime, endTime, assetId) {
	return new Promise((resolve, reject) => {

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

		occupancyService.getOccupancies(input, user)
			.then(result => {
				resolve(result);
			})
			.catch(err => {
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: err.message });
			});
	});
}

module.exports = {
	getOccupancies
}