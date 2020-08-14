"use strict";
const mongoose = require("mongoose");
const Booking = require("./booking.model").Booking;
const bookingCommon = require("./booking.common");
const gogowakeCommon = require("gogowake-common");
const logger = gogowakeCommon.logger;

const PAID_STATUS = "PAID";

/**
 * By : Ken Lai
 * Date : July 3, 2020
 * 
 */
async function makePayment(input, user) {
	var response = new Object;
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate paidAmount
	if (input.paidAmount == null || input.paidAmount.length < 1) {
		response.status = 400;
		response.message = "paidAmount is mandatory";
		throw response;
	}

	if (Number.isNaN(input.paidAmount) == true) {
		response.status = 400;
		response.message = "Invalid paidAmount";
		throw response;
	}

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
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

	await booking.save()
		.then(() => {
			logger.info("Sucessfully updated PAID status for booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "paymentStatus": booking.paymentStatus };
}

/**
 * By : Ken Lai
 * Date : July 27, 2020
 * 
 */
async function applyDiscount(input, user) {

	var response = new Object;
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate discountedAmount
	if (input.discountedAmount == null || input.discountedAmount.length < 0) {
		response.status = 400;
		response.message = "discountedAmount is mandatory";
		throw response;
	}

	if (Number.isNaN(input.discountedAmount) == true) {
		response.status = 400;
		response.message = "Invalid discountedAmount";
		throw response;
	}

	booking.discountedAmount = input.discountedAmount;

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Gave discount. Final discounted amount : " + booking.discountedAmount;
	booking.history.push(transactionHistory);

	await booking.save()
		.then(() => {
			logger.info("Sucessfully applied discount for booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

module.exports = {
	makePayment,
	applyDiscount,
}

