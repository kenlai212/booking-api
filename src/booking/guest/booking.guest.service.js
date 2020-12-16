"use strict";
const Joi = require("joi");

const customError = require("../../common/customError")
const bookingCommon = require("../booking.common");
const utility = require("../../common/utility");

const profileHelper = require("../../common/profile/profile.helper");

async function removeGuest(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		guestId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	//find targetGuest and remove from guests array
	var targetGuest;
	if (booking.guests != null && booking.guests.length > 0) {
		booking.guests.forEach((guest, index, object) => {
			if (guest._id == input.guestId) {
				targetGuest = guest;
				object.splice(index, 1);
			}
		});
	}
	
	if (targetGuest == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Guest not found" };
	}

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Removed guest ${JSON.stringify(targetGuest)} from booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

async function addGuest(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		personalInfo: Joi
			.object()
			.required(),
		contact: Joi
			.object()
			.allow(null),
		picture: Joi
			.object()
			.allow(null)
	});
	utility.validateInput(schema, input);
	
	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	if (booking.guests == null) {
		booking.guests = [];
	}

	//check if guest already exist
	var foundExistingGuest = false;
	booking.guests.forEach(guest => {
		if (guest.name == input.personalInfo.name) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest == true) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already exist" };
	}

	//set guest
	let guest = new Object();

	//validate profile input
	profileHelper.validatePersonalInfoInput(input.personalInfo);
	guest = profileHelper.setPersonalInfo(input.personalInfo, guest);

	if(input.contact != null){
		profileHelper.validateContactInput(input.contact);
		guest = profileHelper.setContact(input.contact, guest);
	}

	if(input.picture != null){
		profileHelper.validatePictureInput(input.picture);
		guest = profileHelper.setPicture(input.picture, guest);
	}
	
	booking.guests.push(guest);

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Added guest ${JSON.stringify(guest)} to booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

async function editPersonalInfo(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		guestId: Joi
			.string()
			.required(),
		personalInfo: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate personalInfo input
	profileHelper.validatePersonalInfoInput(input.profile, false);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	let targetGuest;
	booking.guests.forEach(guest => {
		if (guest._id == input.guestId) {
			//set personalInfo
			guest = profileHelper.setPersonalInfo(input.personalInfo, guest);

			targetGuest = guest;
		}
	});

	if (targetGuest == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };
	}

	//update booking record
	const bookingOutput = bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Updated guest personalInfo ${JSON.stringify(targetGuest)} from booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

module.exports = {
	addGuest,
	removeGuest,
	editPersonalInfo
}