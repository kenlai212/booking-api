"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");

const customError = require("../common/customError")
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const bookingCommon = require("./booking.common");
const Booking = require("./booking.model").Booking;
const BookingHistory = require("./booking-history.model").BookingHistory;
const BookingDurationHelper = require("./bookingDuration.helper");
const PricingHelper = require("./pricing_internal.helper");
const OccupancyHelper = require("./occupancy_internal.helper");
const NotificationHelper = require("./notification_external.helper");


const UTC_OFFSET = 8;

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
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		contactName: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86")
			.required(),
		telephoneNumber: Joi.string().required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = moment(input.startTime).toDate();
	const endTime = moment(input.endTime).toDate();

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		//check minimum booking duration, maximum booking duration, earliest startTime
		try {
			BookingDurationHelper.checkMimumDuration(startTime, endTime);
			BookingDurationHelper.checkMaximumDuration(startTime, endTime);
			BookingDurationHelper.checkEarliestStartTime(startTime, UTC_OFFSET);
			BookingDurationHelper.checkLatestEndTime(endTime, UTC_OFFSET);
		} catch (err) {
			throw { name: customError.BAD_REQUEST_ERROR, message: err };
		}
	}

	//check for retro booking (booing before current time)
	if (startTime < moment().toDate() || endTime < moment().toDate()) {
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking cannot be in the past" };
	}

	//init booking object
	var booking = new Booking();
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
		occupancy = await OccupancyHelper.occupyAsset(booking.startTime, booking.endTime, booking.assetId, booking.bookingType);
	} catch (err) {
		logger.error("OccupancyHelper.occupyAsset Error", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	//save booking
	booking.occupancyId = occupancy.id;
	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	//send notification to admin
	try {
		//await NotificationHelper.newBookingNotificationToAdmin(booking);
	} catch (err) {
		logger.error("NotificationHelper.newBookingNotificationToAdmin Error", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}
			
	//send confirmation to customer
	try {
		//await NotificationHelper.newBookingConfirmationToCustomer(booking);
	} catch (err) {
		logger.error("NotificationHelper.newBookingConfirmationToCustomer Error", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return bookingCommon.bookingToOutputObj(newBooking);
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
		bookingId: Joi
			.string()
			.required(),
		fulfilledHours: Joi
			.number()
			.required()
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
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	if (booking == null) {
		reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
	}

	//check fulfilledHours not longer booking duration
	try {
		BookingDurationHelper.checkFulfilledTime(targetBooking.startTime, targetBooking.endTime, input.fulfilledHours);
	} catch (err) {
		reject({ name: customError.BAD_REQUEST_ERROR, message: result });
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
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return bookingCommon.bookingToOutputObj(newBooking);
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
		bookingId: Joi
			.string()
			.required()
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
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	if (booking == null) {
		reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
	}

	//release occupancy
	try {
		await OccupancyHelper.releaseOccupancy(booking.occupancyId);
	} catch (err) {
		logger.error("OccupancyHelper.releaseOccupancy Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//delete booking record
	await Booking.findByIdAndDelete(targetBooking._id.toString());

	//save into bookingHistory
	const bookingHistory = new BookingHistory();
	bookingHistory.startTime = targetBooking.startTime;
	bookingHistory.endTime = targetBooking.endTime;
	bookingHistory.contactName = targetBooking.contactName;
	bookingHistory.telephoneCountryCode = targetBooking.telephoneCountryCode;
	bookingHistory.telephoneNumber = targetBooking.telephoneNumber;
	bookingHistory.emailAddress = targetBooking.emailAddress;
	bookingHistory.status = CANCELLED_STATUS;

	try {
		await bookingHistory.save();
	} catch (err) {
		logger.error("bookingHistory.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	retrun { "status": "SUCCESS" };
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
		bookingId: Joi
			.string()
			.required()
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
 * Date : Jul 24, 2020
 */
async function editContact(input, user) {
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
		bookingId: Joi
			.string()
			.required(),
		contactName: Joi
			.string()
			.require(),
		telephoneCountryCode: Joi
			.string()
			.valid(bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES)
			.require(),
		telephoneNumber: Joi
			.string()
			.require()
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

	booking.contactName = input.contactName;
	booking.telephoneCountryCode = input.telephoneCountryCode;
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
		transactionTime: moment().toDate(),
		transactionDescription: "Edited contact info",
		userId: user.id,
		userName: user.name
	});

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(newBooking);
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
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = moment(input.startTime).toDate();
	const endTime = moment(input.endTime).toDate();

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
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}
	
	var outputObjs = [];
	bookings.forEach((booking) => {
		const outputObj = bookingCommon.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	});

	return { "bookings": outputObjs };
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
		bookingId: Joi.string().required()
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
	editContact,
	reschedule
}