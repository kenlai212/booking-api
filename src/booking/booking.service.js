"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");
const config = require("config");

const utility = require("../common/utility");
const customError = require("../common/customError");
const logger = require("../common/logger").logger;
const userAuthorization = require("../common/middleware/userAuthorization");

const bookingCommon = require("./booking.common");

const Booking = require("./booking.model").Booking;
const bookingHistorySerivce = require("./bookingHistory.service");
const PassBooking = require("./passBooking.model").PassBooking;
const BookingDurationHelper = require("./bookingDuration.helper");
const PricingHelper = require("./pricing_internal.helper");
const OccupancyHelper = require("./occupancy_internal.helper");
const NotificationHelper = require("./notification_internal.helper");
const crewHelper = require("./crew_internal.helper");

//constants for booking types
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

//constants for booking status
const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

//constants for payment status
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

const DEFAULT_ASSET_ID = "MC_NXT20";

/**
 * By : Ken Lai
 * Date : Mar 25, 2020
 * 
 * Add new booking record to database, then add a corrisponding
 * new occupancy record by calling occupancy service
 */
async function addNewBooking(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		hostName: Joi.string().min(1).required(),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86"),
		telephoneNumber: Joi.string().min(1),
		emailAddress: Joi.string().min(1),
		crewId: Joi.string().min(1)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		//check minimum booking duration, maximum booking duration, earliest startTime
		try {
			//BookingDurationHelper.checkMimumDuration(startTime, endTime);
			//BookingDurationHelper.checkMaximumDuration(startTime, endTime);
			//BookingDurationHelper.checkEarliestStartTime(startTime, UTC_OFFSET);
			//BookingDurationHelper.checkLatestEndTime(endTime, UTC_OFFSET);
		} catch (err) {
			throw { name: customError.BAD_REQUEST_ERROR, message: err };
		}
	}

	//check for retro booking (booing before current time)
	if (startTime < moment().toDate() || endTime < moment().toDate()) {
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking cannot be in the past" };
	}

	//init booking object
	let booking = new Booking();
	booking.startTime = startTime;
	booking.endTime = endTime;

	//set booking status
	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		booking.status = AWAITING_CONFIRMATION_STATUS;
	} else {
		booking.status = CONFIRMED_BOOKING_STATUS;
	}

	//set bookingType
	//TODO validate if user can do OWNER_BOOKING
	booking.bookingType = input.bookingType;

	//set invoice
	const totalAmountObj = PricingHelper.calculateTotalAmount(input.startTime, input.endTime, input.utcOffset, booking.bookingType);
	booking.invoice = new Object();
	booking.invoice.regularAmount = totalAmountObj.regularAmount;
	booking.invoice.totalAmount = totalAmountObj.totalAmount;

	if (totalAmountObj.discounts != null && totalAmountObj.discounts.length > 0) {
		booking.invoice.discounts = totalAmountObj.discounts;
	}

	booking.invoice.paidAmount = 0;
	booking.invoice.balance = totalAmountObj.totalAmount;
	booking.invoice.unitPrice = totalAmountObj.unitPrice;
	booking.invoice.currency = totalAmountObj.currency;
	booking.invoice.paymentStatus = AWAITING_PAYMENT_STATUS;

	booking.durationByHours = totalAmountObj.durationByHours;

	//set host
	booking.host.hostName = input.hostName;

	if (input.telephoneNumber != null) {

		//telephoneCountryCode cannot be null if telephoneNumber is not null
		if (input.telephoneCountryCode == null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "telephoneCountryCode is mandatory" };
		}

		booking.host.telephoneNumber = input.telephoneNumber;
		booking.host.telephoneCountryCode = input.telephoneCountryCode;
	}
	
	if (input.emailAddress != null) {
		booking.host.emailAddress = input.emailAddress;
	}

	//set first guest as contact
	const firstGuest = new Object();
	firstGuest.guestName = booking.host.hostName;

	if (booking.host.telephoneNumber != null) {
		firstGuest.telephoneNumber = booking.host.telephoneNumber;
		firstGuest.telephoneCountryCode = booking.host.telephoneCountryCode;
	}

	if (booking.host.emailAddress != null) {
		firstGuest.emailAddress = booking.host.emailAddress;
	}
	
	booking.guests = [firstGuest];
	
	//add crew 
	//TODO auto add crew based on schedule
	if (input.crewId != null) {
		let crew;
		try {
			crew = await crewHelper.getCrew(input.crewId);
		} catch (err) {
			logger.error("crewHelper.getCrew Error : ", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}

		if (crew == null) {
			throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
		}

		//add crew
		if (booking.crews == null) {
			booking.crews = new Array();
		}

		booking.crews.push({
			crewId: crew.id,
			crewName: crew.crewName,
			telephoneCountryCode: crew.telephoneCountryCode,
			telephoneNumber: crew.telephoneNumber,
			assignmentTime: moment().toDate(),
			assignmentBy: user.id
		});
	}

	booking.creationTime = moment().toDate();
	booking.createdBy = user.id;

	//set assetId
	if (input.assetId == null) {
		booking.assetId = DEFAULT_ASSET_ID;
	} else {
		//TODO add assetId validation
		booking.assetId = input.assetId;
	}

	//save occupancy record
	let occupancy;
	try {
		occupancy = await OccupancyHelper.occupyAsset(input.startTime, input.endTime, input.utcOffset, booking.assetId, booking.bookingType);
	} catch (err) {
		logger.error("OccupancyHelper.occupyAsset Error", err);
		throw err;
	}

	//save booking
	booking.occupancyId = occupancy.id;
	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save bookingHistory
	let initBookingHistoryInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().format("YYYY-MM-DDTHH:mm:ss"),
		transactionDescription: "New booking",
		userId: user.id,
		userName: user.name,
	};
	
	try {
		await bookingHistorySerivce.initBookingHistory(initBookingHistoryInput, user);
	} catch (err) {
		logger.error("bookingHistorySerivce.initBookingHistory Error", err);
	}
	
	//send notification to admin
	if (config.get("booking.newBookingAdminNotification.send") == true) {
		try {
			await NotificationHelper.newBookingNotificationToAdmin(booking);
		} catch (err) {
			logger.error("NotificationHelper.newBookingNotificationToAdmin Error", err);
			throw err;
		}
	}
		
	//send confirmation to customer
	if (config.get("booking.newBookingCustomerConfirmation.send") == true) {
		try {
			await NotificationHelper.newBookingConfirmationToCustomer(booking);
		} catch (err) {
			logger.error("NotificationHelper.newBookingConfirmationToCustomer Error", err);
			throw err;
		}
	}

	return bookingCommon.bookingToOutputObj(booking);
}

/**
 * By : Ken Lai
 * Date : June, 12 2020
 * 
 * fulfill the booking, by seting the fulfilledHours and setting the status to "FULFILLED"
 * add fulfill history record
 */
async function fulfillBooking(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}
	
	//check if booking if already fulfilled
	if (booking.status == FULFILLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };
	}

	//check fulfilledHours not longer booking duration
	if (input.fulfilledHours > booking.durationByHours) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };
	}

	booking.fulfilledHours = input.fulfilledHours;
	booking.status = FULFILLED_STATUS;

	const fulfilledHistory = {
		transactionTime: moment().toDate(),
		transactionDescription: "Fulfilled booking",
		userId: user.id,
		userName: user.name
	}
	booking.history.push(fulfilledHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

/**
 * By : Ken Lai
 * Date : Mar 12, 2020
 * 
 * delete booking from database, delete the corrisponding occupancy record by calling occupancy service.
 */
async function cancelBooking(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//release occupancy
	try {
		await OccupancyHelper.releaseOccupancy(booking.occupancyId);
	} catch (err) {
		logger.error("OccupancyHelper.releaseOccupancy Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//delete booking record
	try {
		await Booking.findByIdAndDelete(booking._id.toString());
	} catch (err) {
		logger.error("Booking.findByIdAndDelete Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	//save into bookingHistory
	const bookingHistory = new BookingHistory();
	bookingHistory.bookingId = booking._id;
	bookingHistory.startTime = booking.startTime;
	bookingHistory.endTime = booking.endTime;
	bookingHistory.contactName = booking.contactName;
	bookingHistory.telephoneCountryCode = booking.telephoneCountryCode;
	bookingHistory.telephoneNumber = booking.telephoneNumber;
	bookingHistory.emailAddress = booking.emailAddress;
	bookingHistory.status = CANCELLED_STATUS;

	try {
		await bookingHistory.save();
	} catch (err) {
		//TODO roll back releaseOccupancy
		logger.error("bookingHistory.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	return bookingHistory;
}

/**
 * By : Ken Lai
 * Date: Aug 03, 2020
 */
async function reschedule(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId)
	} catch (err) {
		logger.error("Internal Server Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//TODO......
}

/**
 * By : Ken Lai
 * Date : Mar 01, 2020
 * 
 * Returns all bookings withint a datetime range
 */
async function viewBookings(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then endTime" };
	}

	//get bookings
	let bookings;
	try {
		bookings = await Booking.find(
			{
				startTime: { $gte: startTime },
				endTime: { $lt: endTime }
			})
			.sort("startTime");
	} catch (err) {
		logger.error("Booking.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	var outputObjs = [];
	bookings.forEach((booking) => {
		const outputObj = bookingCommon.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	});

	return {
		"count": outputObjs.length,
		"bookings": outputObjs
	};
}

async function findBookingById(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}
	
	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	addNewBooking,
	cancelBooking,
	fulfillBooking,
	viewBookings,
	findBookingById,
	reschedule
}