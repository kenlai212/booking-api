const winston = require("winston/lib/winston/config");

const customError = require("../errors/customError");

function newBookingNotificationToAdmin(booking){
    return new Promise((resolve, reject) => {
        const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;
	
        const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
        var bodyHTML = "<html>";
        bodyHTML += "<body>";
        bodyHTML += "<div>New Booking recieved form " + booking.contactName + "</div>";
        bodyHTML += "<div>" + booking.startTime + "&nbsp;to&nbsp;" + booking.endTime + "</div>";
        bodyHTML += "<div>Go to details <a href=" + linkToThankyouPage +">here</a></div>";
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

        common.callAPI(url, requestAttr)
            .then(result => {
                resolve({messageId: result.messageId});
            })
            .catch(err => {
                winston.error("External Email Notification Error", err);
                reject({name: customError.INTERNAL_SERVER_ERROR, message: "External Email Notification Error"});
            });
    });
    
}

function newBookingConfirmationToCustomer(booking){
    return new Promise((resolve, reject) => {
        //TODO add chinese language confirmation
		if (process.env.SEND_NEW_BOOKING_CUSTOMER_CONFIRMATION_EMAIL == true && booking.emailAddress != null) {
			const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;
	
			const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
			var bodyHTML = "<html>";
			bodyHTML += "<head>";
			bodyHTML += "</head>";
			bodyHTML += "<body>";
			bodyHTML += "<div>Thank you for booking with us.</div>";
			bodyHTML += "<div>You can view your booking details <a href=" + linkToThankyouPage +">here</a></div>";
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
	
			common.callAPI(url, requestAttr)
				.then(result => {
                    resolve({ messageId: result.messageId });
				})
				.catch(err => {
                    winston.error("External Email Notification Error", err);
                    reject({name: customError.INTERNAL_SERVER_ERROR, message: "External Email Notification Error"});
				});
		}
    });
    
}

module.exports = {
    newBookingNotificationToAdmin,
    newBookingConfirmationToCustomer
}