const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const SEND_EMAIL_PATH = "/email";
const SEND_SMS_PATH = "/sms";

async function newBookingNotificationToAdmin(booking){
	const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;

	const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
	var bodyHTML = "<html>";
	bodyHTML += "<body>";
	bodyHTML += "<div>New Booking recieved form " + booking.contactName + "</div>";
	bodyHTML += "<div>" + booking.startTime + "&nbsp;to&nbsp;" + booking.endTime + "</div>";
	bodyHTML += "<div>Go to details <a href=" + linkToThankyouPage + ">here</a></div>";
	bodyHTML += "</body>";
	bodyHTML += "</html>";

	const data = {
		"sender": "booking@hebewake.com",
		"recipient": "gogowakehk@gmail.com",
		"emailBody": bodyHTML
	}

	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		},
		body: JSON.stringify(data)
	}

	try {
		const result = await gogowakeCommon.callAPI(url, requestAttr);
		return { messageId: result.messageId };
	} catch (err) {
		logger.error("external email service Error", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}
}

async function newBookingConfirmationToCustomer(booking){
	//TODO add chinese language confirmation

	const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;

	const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
	var bodyHTML = "<html>";
	bodyHTML += "<head>";
	bodyHTML += "</head>";
	bodyHTML += "<body>";
	bodyHTML += "<div>Thank you for booking with us.</div>";
	bodyHTML += "<div>You can view your booking details <a href=" + linkToThankyouPage + ">here</a></div>";
	bodyHTML += "</body>";
	bodyHTML += "</html>";

	const data = {
		"sender": "booking@hebewake.com",
		"recipient": booking.emailAddress,
		"emailBody": bodyHTML
	}
	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		},
		body: JSON.stringify(data)
	}

	try {
		const result = await gogowakeCommon.callAPI(url, requestAttr);
		return { messageId: result.messageId };
	} catch (err) {
		logger.error("External Email Notification Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "External Email Notification Error" };
	}
}

async function sendDisclaimerNotification(bookingId, disclaimerId, telephoneNumber) {
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

	try {
		const result = await gogowakeCommon.callAPI(apiURL, requestAttr);
		return { messageId: result.messageId };
	} catch (err) {
		logger.error("External Email Notification Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "External Email Notification Error" };
	}
}

module.exports = {
    newBookingNotificationToAdmin,
	newBookingConfirmationToCustomer,
	sendDisclaimerNotification
}