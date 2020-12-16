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
const hostService = require("./host/booking.host.service");
const guestService = require("./guest/booking.guest.service");
const invoiceService = require("./invoice/booking.invoice.service");
const statusService = require("./status/booking.status.service");
const bookingCrewService = require("./crew/booking.crew.service");
const occupancyHelper = require("./occupancy_internal.helper");

//constants for booking types
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

async function addNewBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().min(1).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		crewId: Joi.string().min(1),
		personalInfo: Joi.object().required(),
		contact: Joi.object().allow(null),
		picture: Joi.object().allow(null)
	});
	utility.validateInput(schema, input);

	//validate host data
	profileHelper.validatePersonalInfoInput(input.personalInfo);

	if(input.contact != null){
		profileHelper.validateContactInput(input.contact);
	}

	if(input.picture != null){
		profileHelper.validatePictureInput(input.picture);
	}

	//validate assetId
	if(input.assetId != "MC_NXT20"){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
	}

	//TODO validate if user can do OWNER_BOOKING

	//set start and end time
	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		//check minimum booking duration, maximum booking duration, earliest startTime
		try {
			//bookingDurationHelper.checkMimumDuration(startTime, endTime);
			//bookingDurationHelper.checkMaximumDuration(startTime, endTime);
			//bookingDurationHelper.checkEarliestStartTime(startTime, UTC_OFFSET);
			//bookingDurationHelper.checkLatestEndTime(endTime, UTC_OFFSET);
		} catch (err) {
			throw { name: customError.BAD_REQUEST_ERROR, message: err };
		}
	}

	//check for retro booking (booing before current time)
	if (startTime < moment().toDate() || endTime < moment().toDate()) {
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking cannot be in the past" };
	}
	
	//check availability
	const checkAvailabilityInput = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetId: input.assetId
	}

	await occupancyHelper.checkAvailability(checkAvailabilityInput, user);

	//init booking object
	const initBookingInput = {
		startTime: startTime,
		endTime: endTime,
		bookingType: input.bookingType,
		assetId: input.assetId
	}

	let bookingOutput = await statusService.initBooking(initBookingInput, user);

	//save occupancy record
	const occupyAssetInput = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetId: input.assetId,
		bookingId: bookingOutput.id,
		bookingType: input.bookingType
	}

	occupancyHelper.occupyAsset(occupyAssetInput)
	.catch(() => {
		logger.error(`Booking(${bookingOutput.id}) recorded, but failed to occupyAsset. Please trigger occupyAsset manually ${JSON.stringify(occupyAssetInput)}`);
	});

	//confirm booking if it is a OWNER_BOOKING
	if (input.bookingType == OWNER_BOOKING_TYPE) {
		const confirmBookingInput = {
			bookingId: bookingOutput.id
		}

		confirmBooking(confirmBookingInput, user)
		.catch(() => {
			logger.error(`Booking(${bookingOutput.id}) successfully recorded, but failed to confirmBooking`);
		});
	}

	//add host
	const addHostInput = {
		bookingId: bookingOutput.id,
		personalInfo: input.personalInfo,
		contact: input.contact,
		picture: input.picture
	}

	hostService.addHost(addHostInput, user)
	.catch(() => {
		logger.error(`Booking(${bookingOutput.id}) successfully recorded, but failed to addHost ${JSON.stringify(addHostInput)}`);
	});

	//add first guest
	const addGuestInput = {
		bookingId: bookingOutput.id,
		personalInfo: input.personalInfo,
		contact: input.contact,
		picture: input.picture
	}

	guestService.addGuest(addGuestInput, user)
	.catch(error => {
		logger.error(`Booking(${bookingOutput.id}) successfully recorded, but failed to addGuest ${JSON.stringify(addGuestInput)}`);
	});

	//assign crew
	if (input.crewId != null) {
		const assignCrewInput = {
			bookingId: bookingOutput.id, 
			crewId: input.crewId
		}

		bookingCrewService.assignCrew(assignCrewInput, user)
		.catch(() => {
			logger.error(`booking (${bookingOutput.id}) created, but failed to assgin to crew(${input.crewId}), please assign manually`);
		});
	}

	//init bookingInvoice
	const initInvoiceInput = {
		bookingId: bookingOutput.id,
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		bookingType: input.bookingType
	}

	invoiceService.initBookingInvoice(initInvoiceInput, user)
	.catch(() => {
		logger.error(`Booking(${bookingOutput.id}) successfully recorded, but failed to initInvoice ${JSON.stringify(initInvoiceInput)}`);
	});

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
	
	return bookingOutput;
}

async function reschedule(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

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
	utility.validateInput(schema, input);

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
	viewBookings,
	findBookingById,
	reschedule
}