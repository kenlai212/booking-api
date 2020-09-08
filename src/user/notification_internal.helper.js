const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const notificationService = require("../notification/notification.service");

async function sendEmail(sender, recipient, emailBody, subject){
    input = {
        sender: sender,
        recipient: recipient,
        emailBody: emailBody,
        subject: subject
    }

    try {
        return await notificationService.sendEmail(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.occupyAsset : ", err);
        throw err;
    }
}

module.exports = {
    sendEmail
}