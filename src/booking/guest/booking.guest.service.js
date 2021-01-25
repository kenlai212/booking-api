"use strict";
const Joi = require("joi");

const customError = require("../../common/customError")
const bookingCommon = require("../booking.common");
const utility = require("../../common/utility");

const profileHelper = require("../../common/profile/profile.helper");
const customerHelper = require("../customer_internal.helper");

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
		customerId: Joi
			.string()
			.min(1),
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

	if (booking.guests == null) {
		booking.guests = [];
	}

	let targetCustomer;
	if(input.customerId){
		//customerId provided. This will be an existing customer
		targetCustomer = await customerHelper.findCustomer({id: input.customerId}, user);

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

	//check if guest already exist
	var foundExistingGuest = false;
	booking.guests.forEach(guest => {
		if (guest.customerId === targetCustomer.id) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest == true) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already exist" };
	}

	//set guest
	let guest = new Object();
	guest.customerId = targetCustomer.id;
	
	booking.guests.push(guest);

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Added guest ${JSON.stringify(guest)} to booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

module.exports = {
	addGuest,
	removeGuest
}