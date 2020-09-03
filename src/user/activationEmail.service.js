const notificationHelper = require("./notification_internal.helper");

/**
 * By : Ken Lai
 * Date : June 16, 2020
 * 
 * private function send activation email. Use by register and resendActivationEmail
 * */
function sendActivationEmail(activationKey, recipent) {
    return new Promise(async (resolve, reject) => {
        const url = process.env.NOTIFICATION_DOMAIN + EMAIL_PATH;

        const activationURL = process.env.ACTIVATION_URL + "/" + activationKey;
        const bodyHTML = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
        const subject = "GoGoWake Account Activation"

        notificationHelper.sendEmail("registration@hebewake.com", recipent, bodyHTML, subject)
            .then(() => {
                resolve;
            })
            .catch(err => {
                logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
            });
    });
	
}

/*
* By : Ken Lai
* Date : Mar 31, 2020
*
* resend activation email
* only callable by admin
*/
function resendActivationEmail(input) {
    return new Promise(async (resolve, reject) => {
        //validate input data
		const schema = Joi.object({
			userId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

        //get user
        User.findById(userId)
            .then(user => {
                if(user == null){
                    reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid User ID" });
                }

                //update activation key and set AWAITING_ACTIVATION status
                user.activationKey = uuid.v4();
                user.lastUpdateTime = new Date();
                user.status = AWAITING_ACTIVATION_STATUS;

                return user.save();
            })
            .then(user => {
                return sendActivationEmail(user.activationKey, user.emailAddress);
            })
            .then(result => {
                const historyItem = {
                    transactionTime: common.getNowUTCTimeStamp(),
                    transactionDescription: "Sent activation email to user. MessageID : " + result.messageId
                }
                user.history.push(historyItem);

                return user.save();
            })
            .then(() => {
                resolve();
            })
            .catch(err => {
                logger.error("Occupancy.findOne() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
            });
    });
}

module.exports = {
    sendActivationEmail,
    resendActivationEmail
}