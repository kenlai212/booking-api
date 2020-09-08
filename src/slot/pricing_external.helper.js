const config = require("config");
const moment = require("moment");

const common = require("gogowake-common");
const logger = require("../common/logger").logger;

const CALCULATE_TOTAL_AMOUNT_PATH = "/total-amount";

async function calculateTotalAmount(startTime, endTime, assetId) {
	const url = config.get("domainURL.pricing") + CALCULATE_TOTAL_AMOUNT_PATH + "?startTime=" + moment(startTime).toISOString() + "&endTime=" + moment(endTime).toISOString() + "&assetId=" + assetId;
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
		logger.error("external get pricing error : ", err);
		throw err;
	}
}

module.exports = {
	calculateTotalAmount
}