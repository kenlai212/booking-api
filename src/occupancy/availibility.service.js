"use strict";
const moment = require('moment');

const Occupancy = require("./occupancy.model").Occupancy;
const gogowakeCommon = require("gogowake-common");
const logger = gogowakeCommon.logger;

require('dotenv').config();

/**
By : Ken Lai

Private function to return true or false.
Check to see if startTime and endTime will overlap with any
existing occupancies
*/
function checkAvailibility(startTime, endTime, assetId) {
	return new Promise((resolve, reject) => {
		//expand search range to -1 day from startTime and +1 from endTime 
		const searchTimeRangeStart = moment(startTime).subtract(1, 'days');
		const searchTimeRangeEnd = moment(endTime).add(1, 'days');

		//fetch occupancies with in search start and end time
		Occupancy.find(
			{
				startTime: { $gte: searchTimeRangeStart },
				endTime: { $lt: searchTimeRangeEnd },
				assetId: assetId
			})
			.then(occupancies => {
				var isAvailable = true;

				occupancies.forEach((item) => {
					if ((startTime >= item.startTime && startTime <= item.endTime) ||
						(endTime >= item.startTime && endTime <= item.endTime) ||
						(startTime <= item.startTime && endTime >= item.endTime)) {
						isAvailable = false;
					}
				});

				resolve(isAvailable);
			})
			.catch(err => {
				logger.error("Occupancy.find() error : " + err);
				reject(err);
			});
	});
}

module.exports = {
	checkAvailibility
}