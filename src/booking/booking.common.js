"use strict";
const mongoose = require("mongoose");
const moment = require("moment");

const customError = require("../common/customError");
const logger = require("../common/logger").logger;

const Booking = require("./booking.model").Booking;
const bookingHistoryHelper = require("./bookingHistory_internal.helper");
const bookingDurationHelper = require("./bookingDuration.helper");
const customerHelper = require("./customer_internal.helper");
const crewHelper = require("./crew/crew_internal.helper");
const bookingAPIUser = require("../common/bookingAPIUser");

//constants for user groups
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const ACCEPTED_TELEPHONE_COUNTRY_CODES = ["852", "853", "86"];

function addBookingHistoryItem(bookingId, transactionDescription, user){
	const addBookingHistoryItemInput = {
		bookingId: bookingId,
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: transactionDescription
	}

	bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user)
	.catch(() => {
		logger.error(`${transactionDescription}, but failed to addHistoryItem. Please trigger addHistoryItem manually.`);
	});
}

async function saveBooking(booking){
	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingToOutputObj(booking);
}

async function getBooking(bookingId){
	let booking;
	try {
		booking = await Booking.findById(bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (!booking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return booking;
}

async function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.status = booking.status;

	//set time
	outputObj.startTime = booking.startTime;
	outputObj.endTime = booking.endTime;
	outputObj.durationByHours = bookingDurationHelper.calculateTotalDuration(booking.startTime, booking.endTime);
	outputObj.fulfilledHours = booking.fulfilledHours;
	
	//set host
	if(booking.host && booking.host.customerId){
		outputObj.host = new Object();
		outputObj.host.customerId = booking.host.customerId;
	
		let targetCustomer;
		try{
			targetCustomer = await customerHelper.findCustomer({id: booking.host.customerId}, bookingAPIUser.userObject);
		}catch(error){
			logger.error("booking.common.bookingToOutputObj() customerHelper.findCustomer", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
		
		outputObj.host.personalInfo = targetCustomer.personalInfo;
		outputObj.host.contact = targetCustomer.contact;
		outputObj.host.picture = targetCustomer.picture;
	}

	//set guests
	if(booking.guests){
		outputObj.guests = [];
		for(const guest of booking.guests){
			let tempGuest = new Object();
			tempGuest.id = guest._id.toString();
			tempGuest.customerId = guest.customerId;
			tempGuest.disclaimerId = guest.disclaimerId;
			tempGuest.signedDisclaimerTimeStamp = guest.signedDisclaimerTimeStamp;
			
			let targetCustomer;
			try{
				targetCustomer = await customerHelper.findCustomer({id: guest.customerId}, bookingAPIUser.userObject);
			}catch(error){
				logger.error("booking.common.bookingToOutputObj() customerHelper.findCustomer", error);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
	
			tempGuest.personalInfo = targetCustomer.personalInfo;
			tempGuest.contact = targetCustomer.contact;
			tempGuest.picture = targetCustomer.picture;

			outputObj.guests.push(tempGuest);
		}
	}
	
	//set crews
	if (booking.crews && booking.crews.length > 0) {
		outputObj.crews = [];

		for(const crew of booking.crews){
			let tempCrew = new Object();
			tempCrew.id = crew.crewId;
			tempCrew.assignmentTime = crew.assignmentTime;
			tempCrew.assignmentBy = crew.assignmentBy;
	
			let targetCrew;
			try{
				targetCrew = await crewHelper.getCrew(crew.crewId);
			}catch(error){
				logger.error("booking.common.bookingToOutputObj() crewHelper.getCrew", err);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}

			tempCrew.personalInfo = targetCrew.personalInfo;
			tempCrew.contact = targetCrew.contact;
			tempCrew.picture = targetCrew.picture;

			outputObj.crews.push(tempCrew);
		}
	}

	return outputObj;
}

module.exports = {
	BOOKING_ADMIN_GROUP,
	BOOKING_USER_GROUP,
	ACCEPTED_TELEPHONE_COUNTRY_CODES,
	bookingToOutputObj,
	getBooking,
	saveBooking,
	addBookingHistoryItem
}
