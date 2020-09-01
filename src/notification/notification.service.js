"use strict";
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");

/****************************************************************
By : Ken Lai
Date : Mar 18, 2020

send email using aws ses service
*****************************************************************/
function sendEmail(input, user){
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			"NOTIFICATION_ADMIN_GROUP",
			"NOTIFICATION_POWER_USER_GROUP",
			"NOTIFICATION_USER_GROUP",
			"BOOKING_ADMIN_GROUP",
			"BOOKING_USER_GROUP"
		]
	
		//validate user group
		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			sender: Joi
				.string()
				.valid("booking@hebewake.com",
				"registration@hebewake.com",
				"booking@gogowake.com",
				"registration@gogowake.com")
				.required(),
			recipient: Joi
				.string()
				.required(),
			emailBody: Joi
				.string()
				.required(),
			subject: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}
	
		//set email
		var transporter = nodemailer.createTransport({
			host: process.env.EMAIL_SERVICE,
			port: 465,
			auth: {
				user: process.env.EMAIL_SERVICE_USER,
				pass: process.env.EMAIL_SERVICE_PASSWORD
			}
		});
	
		const bodyHTML = input.emailBody;
	
		var mailOptions = {
			from: input.sender,
			to: input.recipient,
			subject: input.subject,
			html: bodyHTML
		};
	
		transporter.sendMail(mailOptions)
			.then(info => {
				logger.info("Email sent: " + info.response);
				logger.info("Amzon SES messageId : " + info.messageId);

				resolve({
					messageId: info.messageId,
					sentTime: moment().toISOString()
				})
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			})
	});	
}

/****************************************************************
By : Ken Lai
Date : Apr 08, 2020

send sms using aws sns service
*****************************************************************/
async function sendSMS(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			"NOTIFICATION_ADMIN_GROUP",
			"NOTIFICATION_POWER_USER_GROUP",
			"NOTIFICATION_USER_GROUP",
			"BOOKING_ADMIN_GROUP",
			"BOOKING_USER_GROUP"
		]
	
		//validate user group
		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			message: Joi
				.string()
				.required(),
			number: Joi
				.string()
				.required(),
			subject: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}
	
		
		var sendParams = {
			Message: input.message,
			PhoneNumber: '+' + input.number
		}

		var smsParams = {
			attributes: {
				"DefaultSMSType": "Transactional"
			}
		};
		var setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(smsParams).promise();
		var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(sendParams).promise();

		//set sms type to transactional
		setSMSTypePromise
			.then(data => {
				logger.info("successfully set sms type to 'transactional'");
				logger.info("Amazon SNS Request ID : " + data.ResponseMetadata.RequestId);

				return;
			})
			.then(() => {
				//publish the message
				return publishTextPromise;
			})
			.then(data => {
				logger.info("successfully sent sms message");
				logger.info("Amazon SNS Request ID : " + data.ResponseMetadata.RequestId);
				logger.info("Amazon SNS Message ID : " + data.MessageId);

				resolve({
					messageId = data.MessageId,
					sentTime = moment().toISOString()
				});
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	sendEmail,
	sendSMS
}