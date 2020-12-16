"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");
const profileHelper = require("../../common/profile/profile.helper");

async function addHost(input, user){
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.min(1)
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

	//set host
	let host = new Object();

	//validate and set personalInfo input
	profileHelper.validatePersonalInfoInput(input.personalInfo);
	host = profileHelper.setPersonalInfo(input.personalInfo, host);

	//validate and set contact input
	if(input.contact !=null){
		profileHelper.validateContactInput(input.contact);
		host = profileHelper.setContact(input.contact, host);
	}

	//validate and set picture input
	if(input.picture != null){
		profileHelper.validatePictureInput(input.picture);
		host = profileHelper.setPicture(input.picture, host);
	}

	booking.host = host;

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Added host ${JSON.stringify(host)} to booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

async function editPersonalInfo(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.required()
	});
	utility.validateInput(schema, input);

	//validate profile input
	profileHelper.validatePersonalInfoInput(input.personalInfo, false);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);
	
	//set host personalInfo attributes
	booking.host = profileHelper.setPersonalInfo(input.personalInfo, booking.host);

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Updated booking(${bookingOutput.id}) host personalInfo ${JSON.stringify(personalInfo)}`, user);

	return bookingOutput;
}

module.exports = {
	addHost,
	editPersonalInfo
}