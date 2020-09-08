const config = require("config");
const moment = require("moment");

const common = require("gogowake-common");

const OCCUPANCIES_PATH = "/occupancies";

function getOccupancies(startTime, endTime, assetId) {
	const url = config.get("domainURL.occupancy") + OCCUPANCIES_PATH + "?startTime=" + moment(startTime).toISOString() + "&endTime=" + moment(endTime).toISOString() + "&assetId=" + assetId;
	const requestAttr = {
		method: "GET",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		}
	}

	try {
		return await common.callAPI(url, requestAttr);
	} catch (err) {
		logger.error("external occupancies error : ", err);
		throw err;
	}
}

module.exports = {
	getOccupancies
}