const config = require("config");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const notificationHelper = require("./notification_internal.helper");

/**
 * By : Ken Lai
 * Date : June 16, 2020
 * 
 * private function send activation email. Use by register and resendActivationEmail
 * */
async function sendActivationEmail(activationKey, recipent) {
    const activationURL = config.get("user.activation.activationURL") + "/" + activationKey;
    const bodyHTML = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
    const subject = "GoGoWake Account Activation"

    try {
        return await notificationHelper.sendEmail(config.get("user.activation.systemSenderEmailAddress"), recipent, bodyHTML, subject);
    } catch (err) {
        logger.error("notificationHelper.sendEmail error : ", err);
        throw err
    }
}



module.exports = {
    sendActivationEmail
}