"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const customError = require("../common/customError");
const logger = require("../common/logger").logger;

const bookingCommon = require("./booking.common");
const profileHelper = require("../common/profile/profile.helper");

const Booking = require("./booking.model").Booking;
const bookingHistoryHelper = require("./bookingHistory_internal.helper");
const BookingDurationHelper = require("./bookingDuration.helper");
const PricingHelper = require("./pricing_internal.helper");
const OccupancyHelper = require("./occupancy_internal.helper");
const NotificationHelper = require("./notification_internal.helper");
const bookingCrewService = require("./crew/booking.crew.service");
const occupancyHelper = require("./occupancy_internal.helper");

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

async function addNewBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		crewId: Joi.string().min(1),
		profile: Joi.object().required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate profile input
	try{
		profileHelper.validateProfileInput(input.profile, false);
	}catch(error){
		console.log(error);
		throw { name: customError.BAD_REQUEST_ERROR, message: error };
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

	//set host profile attributes
	booking.host = profileHelper.setProfile(input.profile, booking.host);

	//set first guest (same profile as host)
	let firstGuest = new Object();
	firstGuest = profileHelper.setProfile(input.profile, firstGuest);
	
	booking.guests = [firstGuest];

	booking.creationTime = moment().toDate();
	booking.createdBy = user.id;

	//set assetId
	if (input.assetId == null) {
		booking.assetId = DEFAULT_ASSET_ID;
	} else {
		//TODO add assetId validation
		booking.assetId = input.assetId;
	}
	
	//check availability
	const checkAvailabilityInput = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetId: booking.assetId
	}

	let isAvailable;
	try{
		isAvailable = await occupancyHelper.checkAvailability(checkAvailabilityInput, user);
	} catch(err){
		logger.error("occupancyHelper.checkAvailability", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(isAvailable == false){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" };
	}

	//save booking
	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save bookingHistory
	const initBookingHistoryInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset:0,
		transactionDescription: "New booking"
	};
	
	try {
		await bookingHistoryHelper.initBookingHistory(initBookingHistoryInput, user);
	} catch (err) {
		logger.error("bookingHistorySerivce.initBookingHistory Error", err);
		logger.error(`Booking(${booking._id}) successfully recorded, but failed to initBookingHistory ${JSON.stringify(initBookingHistoryInput)}. Please rub initBookingHistory manually.`);
	}

	//save occupancy record
	const occupyAssetInput = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetId: booking.assetId,
		bookingId: booking._id.toString(),
		bookingType: booking.bookingType
	}

	try {
		await OccupancyHelper.occupyAsset(occupyAssetInput);
	} catch (err) {
		logger.error("OccupancyHelper.occupyAsset Error", err);
		logger.error(`Booking(${booking._id}) recorded, but failed to occupyAsset. Please trigger occupyAsset manually ${JSON.stringify(occupyAssetInput)}`);
	}

	//assign crew
	if (input.crewId != null) {
		const assignCrewInput = {
			bookingId: booking._id.toString(), 
			crewId: input.crewId
		}

		try{
			booking = await bookingCrewService.assignCrew(assignCrewInput, user);
		}catch(error ){
			logger.error("bookingCrewService.assignCrew error : ", error);
			logger.error(`booking (${booking.id}) created, but failed to assgin to crew(${input.crewId}), please assign manually`);
		}
	}

	/*
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
	*/
	
	return bookingCommon.bookingToOutputObj(booking);
}

async function fulfillBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}
	
	//check if booking if already fulfilled
	if (booking.status == FULFILLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };
	}

	//check fulfilledHours not longer booking duration
	if (input.fulfilledHours > booking.durationByHours) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };
	}

	//check if booking is cancelled
	if (booking.status == CANCELLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };
	}

	booking.fulfilledHours = input.fulfilledHours;
	booking.status = FULFILLED_STATUS;

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//save bookingHistory
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: "Fulfill booking"
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`booking(${booking._id.toString()}) status changed to FULFILLED, but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

async function cancelBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//check if booking is already CANCELLED
	if (booking.status == CANCELLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already cancelled" };
	}

	//check if booking is already FULFILLED
	if (booking.status == FULFILLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot cancel an already fulfilled booking" };
	}

	//change booking status to cancel
	booking.status = CANCELLED_STATUS;

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save() Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//release occupancy
	releaseOccupancyInput = {
        bookingId: booking._id.toString(),
        bookingType: booking.bookingType
	}
	
	try {
		await OccupancyHelper.releaseOccupancy(releaseOccupancyInput, user);
	} catch (err) {
		logger.error("OccupancyHelper.releaseOccupancy Error", err);
		logger.error(`Book(${booking._id.toString()}) status changed to CANCELLED, but failed to releaseOccupancy`);
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: "Cancelled booking"
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`booking(${booking._id.toString()}) status changed to CANCELLED, but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}
	
	return bookingCommon.bookingToOutputObj(booking);
}

async function reschedule(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//TODO......
}

async function viewBookings(input, user) {
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