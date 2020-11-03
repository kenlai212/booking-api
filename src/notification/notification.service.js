"use strict";
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const Joi = require("joi");
const moment = require("moment");
const config = require("config");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");

const NOTIFICATION_ADMIN_GROUP = "NOTIFICATION_ADMIN";
const NOTIFICATION_POWER_USER_GROUP = "NOTIFICATION_POWER_USER";
const NOTIFICATION_USER_GROUP = "NOTIFICATION_USER";

/**
By : Ken Lai
Date : Mar 18, 2020

send email using aws ses service
**/
async function sendEmail(input, user){
	const rightsGroup = [
		NOTIFICATION_ADMIN_GROUP,
		NOTIFICATION_POWER_USER_GROUP,
		NOTIFICATION_USER_GROUP
	]

	//validate user group
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
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
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//set email
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

/**
By : Ken Lai
Date : Apr 08, 2020

send sms using aws sns service
**/
async function sendSMS(input, user) {
	const rightsGroup = [
		NOTIFICATION_ADMIN_GROUP,
		NOTIFICATION_POWER_USER_GROUP,
		NOTIFICATION_USER_GROUP
	]

	//validate user group
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
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