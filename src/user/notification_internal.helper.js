const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const notificationService = require("../notification/notification.service");

function sendEmail(sender, recipient, emailBody, subject){
    return new Promise((resolve, reject) => {
        input = {
            sender: sender,
            recipient: recipient,
            emailBody: emailBody,
            subject: subject
        }

        notificationService.sendEmail(input, bookingAPIUser.userObject)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                logger.error("Error while call occupancyService.occupyAsset : ", err);
                reject(err);
            });
    });
}

module.exports = {
    sendEmail
}