const config = require("config");

const logger = require("../common/logger").logger;

const notificationService = require("../notification/notification.service");
const bookingAPIUser = require("../common/bookingAPIUser");

async function newBookingNotificationToAdmin(booking) {
	const linkToThankyouPage = config.get("booking.thankYouURL") + booking.id;
	let bodyHTML = "<html>";
	bodyHTML += "<body>";
	bodyHTML += "<div>New Booking recieved form " + booking.contactName + "</div>";
	bodyHTML += "<div>" + booking.startTime + "&nbsp;to&nbsp;" + booking.endTime + "</div>";
	bodyHTML += "<div>Go to details <a href=" + linkToThankyouPage + ">here</a></div>";
	bodyHTML += "</body>";
	bodyHTML += "</html>";

	const input = {
		"sender": config.get("booking.newBookingAdminNotification.systemSenderEmailAddress"),
		"recipient": config.get("booking.newBookingAdminNotification.adminRecipientEmailAdress"),
		"emailBody": bodyHTML
	}

	try {
		return await notificationService.sendEmail(input, bookingAPIUser.userObject);
	} catch (err) {
		logger.error("External Email Service Error", err);
		throw err;
	}
}

async function newBookingConfirmationToCustomer(booking) {
	//TODO add chinese language confirmation
	const linkToThankyouPage = config.get("booking.thankYouURL") + booking.id;
	let bodyHTML = "<html>";
	bodyHTML += "<head>";
	bodyHTML += "</head>";
	bodyHTML += "<body>";
	bodyHTML += "<div>Thank you for booking with us.</div>";
	bodyHTML += "<div>You can view your booking details <a href=" + linkToThankyouPage + ">here</a></div>";
	bodyHTML += "</body>";
	bodyHTML += "</html>";

	const input = {
		"sender": "booking@hebewake.com",
		"recipient": booking.emailAddress,
		"emailBody": bodyHTML
	}

	try {
		return await notificationService.sendEmail(input, bookingAPIUser.userObject);
	} catch (err) {
		logger.error("External Email Service Error", err);
		throw err;
	}
}

async function sendDisclaimerNotification(bookingId, disclaimerId, telephoneNumber) {
	const disclaimerURL = config.get("booking.disclaimerURL"); + "?disclaimerId=" + disclaimerId + "&bookingId=" + bookingId;
	const input = {
		"message": "Please read and acknowledge our disclaimer - " + disclaimerURL,
		"number": telephoneNumber,
		"subject": "GOGOWAKE"
	}

	try {
		return await notificationService.sendSMS(input, bookingAPIUser.userObject);
	} catch (err) {
		logger.error("External SMS Service Error", err);
		throw err;
	}
}

module.exports = {
	newBookingNotificationToAdmin,
	newBookingConfirmationToCustomer,
	sendDisclaimerNotification
}