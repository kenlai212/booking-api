"use strict";
const mongoose = require("mongoose");
const moment = require("moment");

const customError = require("../common/customError");
const logger = require("../common/logger").logger;

const Booking = require("./booking.model").Booking;
const bookingHistoryHelper = require("./bookingHistory_internal.helper");

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
	//valid booking id
	if (mongoose.Types.ObjectId.isValid(bookingId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	return booking;
}

function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id.toString();
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.status = booking.status;

	//set invoice
	outputObj.invoice = new Object();
	outputObj.invoice.regularAmount = booking.invoice.regularAmount;
	outputObj.invoice.totalAmount = booking.invoice.totalAmount;
	outputObj.invoice.balance = booking.invoice.balance;
	outputObj.invoice.currency = booking.invoice.currency;
	outputObj.invoice.unitPrice = booking.invoice.unitPrice;
	outputObj.invoice.paymentStatus = booking.invoice.paymentStatus;

	if (booking.invoice.discounts != null && booking.invoice.discounts.length > 0) {
		outputObj.invoice.discounts = [];

		booking.invoice.discounts.forEach(discount => {
			outputObj.invoice.discounts.push({
				discountId: discount._id.toString(),
				amount: discount.amount,
				discountCode: discount.discountCode
			});
		});
	}

	if (booking.invoice.payments != null && booking.invoice.payments.length > 0) {
		outputObj.invoice.payments = [];

		booking.invoice.payments.forEach(payment => {
			outputObj.invoice.payments.push({
				paymentId: payment._id.toString(),
				amount: payment.amount,
				paymentCode: payment.paymentCode
			});
		});
	}

	//set time
	outputObj.startTime = booking.startTime;
	outputObj.endTime = booking.endTime;
	outputObj.durationByHours = booking.durationByHours;
	outputObj.fulfilledHours = booking.fulfilledHours;
	
	//set host
	outputObj.host = new Object();
	outputObj.host.personalInfo = booking.host.personalInfo;

	if(booking.host.contact != null && (booking.host.contact.telephoneNumber != null || booking.host.contact.emailAddress != null)){
		outputObj.host.contact = booking.host.contact;
	}
	
	if(booking.host.picture != null && booking.host.picture.url != null){
		outputObj.host.picture = booking.host.picture;
	}

	//set guests
	outputObj.guests = [];
	booking.guests.forEach(guest => {
		let tempGuest = new Object();
		tempGuest.id = guest._id.toString();
		tempGuest.disclaimerId = guest.disclaimerId;
		tempGuest.signedDisclaimerTimeStamp = guest.signedDisclaimerTimeStamp;
		tempGuest.personalInfo = guest.personalInfo;

		if(guest.contact != null && (guest.contact.telephoneNumber != null || guest.contact.emailAddress != null)){
			tempGuest.contact = guest.contact;
		}
		
		if(guest.picture != null && guest.picture.url != null){
			tempGuest.picture = guest.picture;
		}

		outputObj.guests.push(tempGuest);
	})

	//set crews
	if (booking.crews != null && booking.crews.length > 0) {
		outputObj.crews = [];

		booking.crews.forEach(crew => {
			let tempCrew = new Object();
			tempCrew.id = crew.crewId;
			tempCrew.name = crew.name;
			tempCrew.assignmentTime = crew.assignmentTime;
			tempCrew.assignmentBy = crew.assignmentBy;
	
			if(crew.contact != null && (crew.contact.telephoneNumber != null || crew.contact.emailAddress != null)){
				tempCrew.contact = crew.contact;
			}
			
			if(crew.picture != null && crew.picture.url != null){
				tempCrew.picture = crew.picture;
			}

			outputObj.crews.push(tempCrew);
		});
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
