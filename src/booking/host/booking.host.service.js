"use strict";
const Joi = require("joi");

const utility = require("../../common/utility");
const customError = require("../../common/customError");

const bookingCommon = require("../booking.common");
const profileHelper = require("../../common/profile/profile.helper");
const customerHelper = require("../customer_internal.helper");

async function addHost(input, user){
	//validate input data
	const schema = Joi.object({
		customerId: Joi
			.string()
			.min(1)
			.allow(null),
		bookingId: Joi
			.string()
			.min(1)
			.required(),
		personalInfo: Joi
			.object()
			.when("customerId", { is: null, then: Joi.required() }),
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

	let targetCustomer;
	if(input.customerId){
		//customerId provided. This will be an existing customer
		targetCustomer = await customerHelper.findCustomer(input.customerId);

		if(!targetCustomer){
			throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid customerId" };
		}

	}else{
		//no customerId provided. This will be a new customer

		profileHelper.validatePersonalInfoInput(input.personalInfo);

		if(input.contact){
			profileHelper.validateContactInput(input.contact);
		}

		if(input.picture){
			profileHelper.validatePictureInput(input.picture);
		}

		const newCustomerInput = {
			personalInfo: input.personalInfo,
			contact: input.contact,
			picture: input.picture
		}

		targetCustomer = await customerHelper.newCustomer(newCustomerInput);
	}

	let host = new Object();
	host.customerId = targetCustomer.id;
	host.personalInfo = targetCustomer.personalInfo;
	host.contact = targetCustomer.contact;
	host.picture = targetCustomer.picture;

	booking.host = host;

	//add first guest
	if (booking.guests == null) {
		booking.guests = [];
	}

	//set guest
	let guest = new Object();
	guest.customerId = targetCustomer.id;
	guest.personalInfo = targetCustomer.personalInfo;
	guest.contact = targetCustomer.contact;
	guest.picture = targetCustomer.picture;
	
	booking.guests.push(guest);

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Added host ${JSON.stringify(host)} and guest ${JSON.stringify(guest)} to booking(${bookingOutput.id})`, user);

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