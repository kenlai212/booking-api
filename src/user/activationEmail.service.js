const notificationHelper = require("./notification_internal.helper");

/**
 * By : Ken Lai
 * Date : June 16, 2020
 * 
 * private function send activation email. Use by register and resendActivationEmail
 * */
async function sendActivationEmail(activationKey, recipent) {
    const url = process.env.NOTIFICATION_DOMAIN + EMAIL_PATH;

    const activationURL = process.env.ACTIVATION_URL + "/" + activationKey;
    const bodyHTML = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
    const subject = "GoGoWake Account Activation"

    try {
        return await notificationHelper.sendEmail("registration@hebewake.com", recipent, bodyHTML, subject);
    } catch (err) {
        logger.error("notificationHelper.sendEmail error : ", err);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }
}

/*
* By : Ken Lai
* Date : Mar 31, 2020
*
* resend activation email
* only callable by admin
*/
async function resendActivationEmail(input) {
    //validate input data
    const schema = Joi.object({
        userId: Joi
            .string()
            .required()
    });

    const result = schema.validate(input);
    if (result.error) {
        throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
    }

    //get user
    let user;
    try {
        user = await User.findById(userId);
    }
    catch (err) {
        logger.error("User.findById error : ", err);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }

    //set activation key and set AWAITING_ACTIVATION status
    user.activationKey = uuid.v4();
    user.lastUpdateTime = new Date();
    user.status = AWAITING_ACTIVATION_STATUS;

    try {
        user = user.save();
    } catch (err) {
        logger.error("user.save error : ", err);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }

    //send activation email
    let sendActivationEmailResult;
    try {
        sendActivationEmailResult = sendActivationEmail(user.activationKey, user.emailAddress);
    } catch (err) {
        logger.error("this.sendActivationEmail error : ", err);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }

    //set history to track send activation email
    const historyItem = {
        transactionTime: common.getNowUTCTimeStamp(),
        transactionDescription: "Sent activation email to user. MessageID : " + sendActivationEmailResult.messageId
    }
    user.history.push(historyItem);

    try {
        user.save();
    } catch (err) {
        logger.error("user.save() error : ", err);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }
}

module.exports = {
    sendActivationEmail,
    resendActivationEmail
}