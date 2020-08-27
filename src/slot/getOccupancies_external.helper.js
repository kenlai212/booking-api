const config = require("config");

const common = require("gogowake-common");

const OCCUPANCIES_PATH = "/occupancies";

module.exports = function (startTime, endTime, assetId) {
	return new Promise((resolve, reject) => {
		const startTimeStr = moment(slots[0].startTime).toISOString();
		const endTimeStr = moment(slots[slots.length - 1].endTime).toISOString();
		const url = config.get("domainURL.occupancy") + OCCUPANCIES_PATH + "?startTime=" + startTimeStr + "&endTime=" + endTimeStr + "&assetId=" + assetId;
		const requestAttr = {
			method: "GET",
			headers: {
				"content-Type": "application/json",
				"Authorization": "Token " + global.accessToken
			}
		}

		common.callAPI(url, requestAttr)
			.then(result => {
				resolve(result);
			})
			.catch(err => {
				reject(err);
			});
	});
	
}