const config = require("config");

const common = require("gogowake-common");

const CALCULATE_TOTAL_AMOUNT_PATH = "/total-amount";

module.exports = function (startTime, endTime, assetId) {
	return new Promise((resolve, reject) => {
		const url = config.get("domainURL.pricing") + CALCULATE_TOTAL_AMOUNT_PATH + "?startTime=" + startTimeStr + "&endTime=" + endTimeStr + "&assetId=" + assetId;
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