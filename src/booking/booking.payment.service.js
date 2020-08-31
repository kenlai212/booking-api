"use strict";
const mongoose = require("mongoose");
const Booking = require("./booking.model").Booking;
const bookingCommon = require("./booking.common");
const gogowakeCommon = require("gogowake-common");
const logger = require("../common/logger").logger;

const PAID_STATUS = "PAID";

/**
 * By : Ken Lai
 * Date : July 3, 2020
 * 
 */
function makePayment(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			paidAmount: Joi
				.number()
				.required(),
			bookingId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//valid booking id
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId"});
		}

		//find booking
		Booking.findById(input.bookingId)
			.exec()
			.then(booking => {
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				booking.paymentStatus = PAID_STATUS;
				booking.paidAmount = Number(input.paidAmount);

				//add transaction history
				var transactionHistory = new Object();
				transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
				transactionHistory.userId = user.id;
				transactionHistory.userName = user.name;
				transactionHistory.transactionDescription = "Payment status made changed to PAID";
				booking.history.push(transactionHistory);

				resolve(booking.save());
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date : July 27, 2020
 * 
 */
function applyDiscount(input, user) {
	return new Promise((resolve, reject) => {

		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			bookingId: Joi
				.string()
				.required(),
			discountAmount: Joi
				.number()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//validate bookingId
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" });
		}

		//find booking
		Booking.findById(input.bookingId)
			.then(booking => {
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				booking.discountedAmount = input.discountedAmount;

				//add transaction history
				var transactionHistory = new Object();
				transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
				transactionHistory.userId = user.id;
				transactionHistory.userName = user.name;
				transactionHistory.transactionDescription = "Gave discount. Final discounted amount : " + booking.discountedAmount;
				booking.history.push(transactionHistory);

				return booking;
			})
			.then(booking => {
				booking.save();

				resolve(booking);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	makePayment,
	applyDiscount,
}

