"use strict";
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const Joi = require("joi");
const moment = require("moment");
const config = require("config");

const utility = require("../common/utility");
const {logger, customError} = utility;

async function sendEmail(input){
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
	utility.validateInput(schema, input);
	
	var transporter = nodemailer.createTransport({
		host: config.get("notification.email.provider"),
		port: config.get("notification.email.port"),
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

	try {
		const info = await transporter.sendMail(mailOptions);

		logger.info("Email sent: " + info.response);
		logger.info("Amazon SES messageId : " + info.messageId);

		return {
			messageId: info.messageId,
			sentTime: moment().toISOString()
		}

	} catch (err) {
		logger.error("transporter.sendMail Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}	
}

async function sendSMS(input) {
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
	utility.validateInput(schema, input);

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const sendParams = {
		Message: input.message,
		PhoneNumber: '+' + input.number
	}

	const smsParams = {
		attributes: {
			"DefaultSMSType": "Transactional"
		}
	};

	const setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(smsParams).promise();
	const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(sendParams).promise();

	//set sms type to transactional
	try {
		const data = await setSMSTypePromise;

		logger.info("successfully set sms type to 'transactional'");
		logger.info("Amazon SNS Request ID : " + data.ResponseMetadata.RequestId);
	} catch (err) {
		logger.error("setSMSTypePromise Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//publish the message
	try {
		const data = await publishTextPromise;

		logger.info("successfully sent sms message");
		logger.info("Amazon SNS Request ID : " + data.ResponseMetadata.RequestId);
		logger.info("Amazon SNS Message ID : " + data.MessageId);

		return {
			messageId: data.MessageId,
			sentTime: moment().toISOString()
		};
	} catch (err) {
		logger.error("publishTextPromise Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

module.exports = {
	sendEmail,
	sendSMS
}