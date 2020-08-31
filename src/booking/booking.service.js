"use strict";
const mongoose = require("mongoose");
const moment = require("moment");

const Booking = require("./booking.model").Booking;
const BookingHistory = require("./booking-history.model").BookingHistory;

const logger = require("../common/logger").logger;
const bookingCommon = require("./booking.common");
const BookingDurationHelper = require("./bookingDuration.helper");
const PricingHelper = require("./pricing_internal.helper");
const OccupancyHelper = require("./occupancy_internal.helper");
const NotificationHelper = require("./notification_external.helper");
const customError = require("../errors/customError")
const gogowakeCommon = require("gogowake-common");

const UTC_OFFSET = 8;

//constants for booking types
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";
const VALID_BOOKING_TYPES = [CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE];

//constants for booking status
const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

//constants for payment status
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

const OCCUPANCY_PATH = "/occupancy";
const RELEASE_OCCUPANCY_PATH = "/occupancy";

/**
 * By : Ken Lai
 * Date : Mar 25, 2020
 * 
 * Add new booking record to database, then add a corrisponding
 * new occupancy record by calling occupancy service
 */
async function addNewBooking(input, user) {
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
			startTime: Joi.date().iso().required(),
			endTime: Joi.date().iso().required(),
			assetId: Joi.string().required(),
			bookingType: Joi
				.string()
				.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
				.required(),
			contactName: Joi
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

		//check if endTime is earlier then startTime
		if (startTime > endTime) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" });
		}

		//calculate duration in milliseconds
		var diffMs;
		diffMs = (endTime - startTime);

		if (booking.bookingType == CUSTOMER_BOOKING_TYPE) {
			//check minimum booking duration, maximum booking duration, earliest startTime
			try{
				BookingDurationHelper.checkMimumDuration(startTime,endTime);
				BookingDurationHelper.checkMaximumDuration(startTime,endTime);
				BookingDurationHelper.checkEarliestStartTime(startTime, UTC_OFFSET);
				BookingDurationHelper.checkLatestEndTime(endTime, UTC_OFFSET);
			}catch(err){
				reject({ name: customError.BAD_REQUEST_ERROR, message: result});
			}
		}

		//set booking status
		if (booking.bookingType == CUSTOMER_BOOKING_TYPE) {
			booking.status = AWAITING_CONFIRMATION_STATUS;
		} else {
			booking.status = CONFIRMED_BOOKING_STATUS;
		}

		//check for retro booking (booing before current time)
		if (endTime < moment().toDate()) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "Booking cannot be in the past" });
		}

		/*
		//check for minimum booking notice
		var latestAdvanceBooking = new Date(startTime);
		latestAdvanceBooking.setUTCHours(latestAdvanceBooking.getHours() - 12);
		latestAdvanceBooking.setUTCMinutes(0);
		var now = new Date();
		now.setHours(now.getHours() + 8);
		if (now > latestAdvanceBooking) {
			response.status = 400;
			response.message = "Must book 12 hours in advanced";
			throw response;
		}
		*/
		//init booking object
		var booking = new Booking();
		booking.startTime = startTime;
		booking.endTime = endTime;

		//calculate pricing & currency
		const totalAmountObj = PricingHelper.calculateTotalAmount(booking.startTime, booking.endTime, booking.bookingType);
		booking.totalAmount = totalAmountObj.totalAmount;
		booking.currency = totalAmountObj.currency;
		booking.paymentStatus = AWAITING_PAYMENT_STATUS;

		booking.contactName = input.contactName;
		booking.telephoneCountryCode = input.telephoneCountryCode;
		booking.telephoneNumber = input.telephoneNumber;

		//set email address if not null
		if (input.emailAddress != null) {
			booking.emailAddress = input.emailAddress;
		}

		//set first guest as contact
		const firstGuest = {
			guestName: booking.contactName,
			telephoneCountryCode: booking.telephoneCountryCode,
			telephoneNumber: booking.telephoneNumber,
			emailAddress: booking.emailAddress
		}
		booking.guests = [firstGuest];

		//add crew //TODO auto add crew based on schedule
		//booking.crews = new Array();

		booking.creationTime = moment().toDate();
		booking.createdBy = user.id;
		booking.history = [{
			transactionTime: moment().toDate(),
			transactionDescription: "New booking",
			userId: user.id,
			userName: user.name
		}]

		//save occupancy record
		OccupancyHelper.occupyAsset(booking.startTime, booking.endTime, booking.assetId, booking.occupancyType)
			.then(newOccupancy => {
				return newOccupancy.id
			})
			.then(occupancyId => {
				//save newBooking record
				booking.occupancyId = occupancyId;
				return booking.save();
			})
			.then(newBooking => {
				//send notification to admin
				NotificationHelper.newBookingNotificationToAdmin(newBooking);

				return newBooking;
			})
			.then(newBooking => {
				//send confirmation to customer
				NotificationHelper.newBookingConfirmationToCustomer(newBooking);

				return newBooking;
			})
			then(newBooking => {
				resolve(bookingCommon.bookingToOutputObj(newBooking));
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date : June, 12 2020
 * 
 * fulfill the booking, by seting the fulfilledHours and setting the status to "FULFILLED"
 * add fulfill history record
 */
async function fulfillBooking(input, user) {
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
			fulfilledHours: Joi
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

		Booking.findById(input.bookingId)
			.then(targetBooking => {
				if (targetBooking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				//check fulfilledHours not longer booking duration
				try {
					BookingDurationHelper.checkFulfilledTime(targetBooking.startTime, targetBooking.endTime, input.fulfilledHours);
				} catch (err) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: result });
				}

				targetBooking.fulfilledHours = input.fulfilledHours;
				targetBooking.status = FULFILLED_STATUS;

				const fulfilledHistory = {
					transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
					transactionDescription: "Fulfilled booking",
					userId: user.id,
					userName: user.name
				}
				targetBooking.history.push(fulfilledHistory);

				return targetBooking
			})
			.then(targetBooking => {
				targetBooking.save();

				resolve(targetBooking);
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date : Mar 12, 2020
 * 
 * delete booking from database, delete the corrisponding occupancy record by calling occupancy service.
 */
async function cancelBooking(input, user) {
	return new Promise((resolve, reject) => {

	});
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

	//validate bookingId
	var targetBooking = await bookingCommon.validateBookingIdInput(input);
	/*
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw(response);
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	var targetBooking;
	await Booking.findById(input.bookingId)
	.then(result => {
		targetBooking = result;
	})
	.catch(err => {
		logger.error("Error while finding target booking, running Booking.findById() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	if(targetBooking == null){
		response.status = 400;
		response.message = "Invalid booking ID";
		throw response;
	}
	*/

	//release occupancy
	const url = process.env.OCCUPANCY_DOMAIN + RELEASE_OCCUPANCY_PATH;
	const data = {
		"occupancyId": targetBooking.occupancyId
	}
	const requestAttr = {
		method: "DELETE",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + user.accessToken
		},
		body: JSON.stringify(data)
	}

	await gogowakeCommon.callAPI(url, requestAttr)
		.catch(err => {
			throw err;
		});

	//delete booking record from db
	await Booking.findByIdAndDelete(targetBooking.id)
	.then(() => {
		logger.info("Deleted booking.id : " + targetBooking.id);
	})
	.catch(err => {
		logger.error("Error while deleting booking, running Booking.findByIdAndDelete() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	//add new booking history
	const bookingHistory = new BookingHistory();
	bookingHistory.startTime = targetBooking.startTime;
	bookingHistory.endTime = targetBooking.endTime;
	bookingHistory.contactName = targetBooking.contactName;
	bookingHistory.telephoneCountryCode = targetBooking.telephoneCountryCode;
	bookingHistory.telephoneNumber = targetBooking.telephoneNumber;
	bookingHistory.emailAddress = targetBooking.emailAddress;
	bookingHistory.status = CANCELLED_STATUS;
	
	await bookingHistory.save()
		.then(bookingHistory => {
			logger.info("Saved new bookingHistory.id : " + bookingHistory._id);
		})
		.catch(err => {
			logger.error("bookingHistoryModel.addNewBookingHistory() error : " + err);
			response.status = 500;
			response.message = "Cancel Booking Service not available";
			throw response;
		});

	return {"status":"SUCCESS"};
}

/**
 * By : Ken Lai
 * Date: Aug 03, 2020
 */
async function reschedule(input, user) {
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

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw (response);
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	var targetBooking;
	await Booking.findById(input.bookingId)
		.then(result => {
			targetBooking = result;
		})
		.catch(err => {
			logger.error("Error while finding target booking, running Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Cancel Booking Service not available";
			throw response;
		});

	if (targetBooking == null) {
		response.status = 400;
		response.message = "Invalid booking ID";
		throw response;
	}
}

/**
 * By : Ken Lai
 * Date : Jul 24, 2020
 */
async function editContact(input, user) {
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
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate contactName
	if (input.contactName == null || input.contactName.length < 1) {
		response.status = 400;
		response.message = "contactName is mandatory";
		throw response;
	}
	booking.contactName = input.contactName;

	//validate country code
	if (input.telephoneCountryCode == null || input.telephoneCountryCode.length < 1) {
		response.status = 400;
		response.message = "telephoneCountryCode is mandatory";
		throw response;
	}

	if (bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES.includes(input.telephoneCountryCode) == false) {
		response.status = 400;
		response.message = "Invalid telephoneCountryCode";
		throw response;
	}
	booking.telephoneCountryCode = input.telephoneCountryCode;

	//validate telephone number
	if (input.telephoneNumber == null || input.telephoneNumber.length < 1) {
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}
	booking.telephoneNumber = input.telephoneNumber;

	//set emailAddress
	if (input.emailAddress != null) {
		if (input.emailAddress.length == 0) {
			booking.emailAddress = null;
		} else {
			booking.emailAddress = input.emailAddress;
		}
	}

	//add transaction history
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Edited contact info",
		userId: user.id,
		userName: user.name
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully edited guest in booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

/**
 * By : Ken Lai
 * Date : Mar 01, 2020
 * 
 * Returns all bookings withint a datetime range
 */
async function viewBookings(input, user){
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

	//validate start and end time
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;	
	}

	var startTime;
	try {
		startTime = gogowakeCommon.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;	
	}

	if (input.endTime == null || input.endTime.length < 1) {
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;	
	}

	var endTime;
	try{
		endTime = gogowakeCommon.standardStringToDate(input.endTime);
	}catch(err){
		response.status = 400;
		response.message = "Invalid endTime format";
		throw response;	
	}

	if(startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	var bookings;
	await Booking.find({
		startTime: { $gte: startTime },
		endTime: { $lt: endTime }
	}).sort("startTime")
		.then(result => {
			bookings = result;
		})
		.catch(err => {
			logger.error("bookingHistoryModel.addNewBookingHistory() error : " + err);
			response.status = 500;
			response.message = "Cancel Booking Service not available";
			throw response;
		});

	var outputObjs = [];
	bookings.forEach((booking) => {
		const outputObj = bookingCommon.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	});

	return { "bookings" : outputObjs };
}

async function findBookingById(input, user) {
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

	var booking;
	await Booking.findById(input.bookingId)
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("booking.findById error : " + err);
			response.status = 500;
			response.message = "Find Bookings Service not available";
			throw response;
		});

	const outputObj = bookingCommon.bookingToOutputObj(booking);

	return outputObj;
}

module.exports = {
	addNewBooking,
	cancelBooking,
	fulfillBooking,
	viewBookings,
	findBookingById,
	editContact
}