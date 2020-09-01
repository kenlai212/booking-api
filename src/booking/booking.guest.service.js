"use strict";
const Joi = require("joi");
var uuid = require('uuid');
const mongoose = require("mongoose");

const Booking = require("./booking.model").Booking;
const bookingCommon = require("./booking.common");
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const sendDisclaimerNotificationHelper = require("./sendDisclaimerNotification_external.helper");

function removeGuest(input, user) {
	return new Promise((resolve, reject) => {
		//validate user group
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP,
			bookingCommon.BOOKING_USER_GROUP
		]

		//validate user
		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			bookingId: Joi.string().min(1).required(),
			guestId: Joi.string().min(1).required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//check bookingId format
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" });
		}

		//find booking
		Booking.findById(input.bookingId)
			.then(booking => {
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				var targetGuest;
				if (booking.guests != null && booking.guests.length > 0) {
					booking.guests.forEach((guest, index, object) => {
						if (guest._id == input.guestId) {
							targetGuest = guest;
							object.splice(index, 1);
						}
					});
				}

				//validate guestId
				if (targetGuest == null) {
					throw { status: 404, message: "Guest not found" };
				}

				//add transaction history
				if (booking.history == null) {
					booking.history = [];
				}
				booking.history.push({
					transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
					transactionDescription: "Removed guest : " + targetGuest.guestName,
					userId: user.id,
					userName: user.name
				});

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

function addGuest(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP,
			bookingCommon.BOOKING_USER_GROUP
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
			guestName: Joi
				.string()
				.required(),
			telephoneCountryCode: Joi
				.string()
				.valid(bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES)
				.required(),
			telephoneNumber: Joi.string().required()
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
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				//add guest
				if (booking.guests == null) {
					booking.guests = [];
				}
				const guest = {
					guestName: input.guestName,
					telephoneCountryCode: input.telephoneCountryCode,
					telephoneNumber: input.telephoneNumber,
					emailAddress: input.emailAddress
				}
				booking.guests.push(guest);

				//add transaction history
				if (booking.history == null) {
					booking.history = [];
				}
				booking.history.push({
					transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
					transactionDescription: "Added new guest : " + input.guestName,
					userId: user.id,
					userName: user.name
				});

				return booking;
			})
			.then(booking => {
				booking.save()

				resolve(booking);
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date : Jul 23, 2020
 */
function editGuest(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP,
			bookingCommon.BOOKING_USER_GROUP
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
			guestId: Joi
				.string()
				.required(),
			guestName: Joi
				.string()
				.required(),
			telephoneCountryCode: Joi
				.string()
				.valid(bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES)
				.required(),
			telephoneNumber: Joi.string().min(1).required()
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
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				var guestFound = false;
				booking.guests.forEach(guest => {
					if (guest._id == input.guestId) {
						guestFound = true;

						guest.guestName = input.guestName;
						guest.telephoneCountryCode = input.telephoneCountryCode;
						guest.telephoneNumber = input.telephoneNumber;
						guest.emailAddress = input.emailAddress;
					}
				});

				if (guestFound == false) {
					response.status = 400;
					response.message = "Invalid guestId";
					throw response;
				}

				//add transaction history
				booking.history.push({
					transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
					transactionDescription: "Edited guest : " + input.guestName,
					userId: user.id,
					userName: user.name
				});

				return booking;
			})
			.then(booking => {
				booking.save();

				resolve(booking);
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});	
}

/**
 * By: Ken Lai
 * Date : July 28, 2020
 * 
 * Public api. Customer can signDisclaimer without signing in 
 */
function signDisclaimer(input) {
	return new Promise((resolve, reject) => {
		//validate input data
		const schema = Joi.object({
			bookingId: Joi
				.string()
				.required(),
			disclaimerId: Joi
				.string()
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
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				var guestFound = false;
				var guestId;
				booking.guests.forEach(guest => {
					if (guest.disclaimerId == input.disclaimerId) {
						guestFound = true;
						guestId = guest._id;
						guest.signedDisclaimerTimeStamp = gogowakeCommon.getNowUTCTimeStamp();
					}
				});

				if (guestFound == false) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid disclaimerId" });
				}

				//add transaction history
				var transactionHistory = new Object();
				transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
				transactionHistory.transactionDescription = "Guest signed disclaimer. GuestId : " + guestId;
				booking.history.push(transactionHistory);

				return booking;
			})
			.then(booking => {
				booking.save();

				resolve(booking);
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date: July 12, 2020
 */
function sendDisclaimer(input, user) {
	return new Promise((resolve, reject) => {
		var response = new Object;
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP,
			bookingCommon.BOOKING_USER_GROUP
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
			guestId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//validate bookingId
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			response.status = 400;
			response.message = "Invalid bookingId";
			throw response;
		}

		//find booking
		Booking.findById(input.bookingId)
			.then(booking => {
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				const disclaimerId = uuid.v4();

				var guest;
				booking.guests.forEach(item => {
					if (item._id == input.guestId) {
						item.disclaimerId = disclaimerId;
						guest = item;
					}
				});

				if (guest == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" });
				}

				//update guest.disclaimerId
				var transactionHistory = new Object();
				transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
				transactionHistory.userId = user.id;
				transactionHistory.userName = user.name;
				transactionHistory.transactionDescription = "Send disclaimer to guest : " + guest.guestName + "(" + guest.telephoneNumber + ")";
				booking.history.push(transactionHistory);

				booking.save();

				return {
					bookingId: booking._id,
					disclaimerId: disclaimerId,
					telephoneNumber: guest.telephoneCountryCode + guest.telephoneNumber
				}
			})
			.then(obj => {
				//send sms
				resolve(sendDisclaimerNotificationHelper.sendNotification(obj.bookingId, obj.disclaimerId, obj.telephoneNumber));
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	addGuest,
	removeGuest,
	editGuest,
	signDisclaimer,
	sendDisclaimer
}