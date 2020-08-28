const config = require("config");

const gogowakeCommon = require("gogowake-common");

const SEND_SMS_PATH = "/sms";

function sendNotification(bookingId, disclaimerId, telephoneNumber) {
	return new Promise((resolve, reject) => {
		const disclaimerURL = config.get("disclaimerURL"); + "?disclaimerId=" + disclaimerId + "&bookingId=" + bookingId;
		const data = {
			"message": "Please read and acknowledge our disclaimer - " + disclaimerURL,
			"number": telephoneNumber,
			"subject": "GOGOWAKE"
		}

		const requestAttr = {
			method: "POST",
			headers: {
				"content-Type": "application/json",
				"Authorization": "Token " + global.accessToken
			},
			body: JSON.stringify(data)
		}

		const apiURL = config.get("domainURL.notification") + SEND_SMS_PATH;

		gogowakeCommon.callAPI(apiURL, requestAttr)
			.then(() => {
				resolve({status: "SUCCESS"});
			})
			.catch(err => {
				reject(err);
			})
	});
}

module.exports = {
    sendNotification
}