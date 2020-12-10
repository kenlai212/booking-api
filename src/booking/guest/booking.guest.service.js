"use strict";
const Joi = require("joi");
const moment = require("moment");

const customError = require("../../common/customError")
const bookingCommon = require("../booking.common");
const logger = require("../../common/logger").logger;
const profileHelper = require("../../common/profile/profile.helper");
const bookingHistoryHelper = require("../bookingHistory_internal.helper");

async function removeGuest(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		guestId: Joi.string().min(1).required()
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

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Removed guest ${targetGuest.name}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Removed guest(${JSON.stringify(targetGuest)}) from booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}
	
	return bookingCommon.bookingToOutputObj(booking);
}

async function addGuest(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		profile: Joi
			.object()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate profile input
	try{
		profileHelper.validateProfileInput(input.profile, false);
	}catch(error){
		throw { name: customError.BAD_REQUEST_ERROR, message: error };
	}

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	if (booking.guests == null) {
		booking.guests = [];
	}

	//check if guest already exist
	var foundExistingGuest = false;
	booking.guests.forEach(guest => {
		if (guest.name == input.profile.name) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest == true) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already exist" };
	}

	//set guest profile attributes, and add to guests array
	let guest = new Object();
	guest = profileHelper.setProfile(input.profile, guest);
	booking.guests.push(guest);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Add guest ${guest.name}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Removed guest(${JSON.stringify(guest)}) to booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

async function editGuest(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		guestId: Joi
			.string()
			.required(),
		profile: Joi
			.object()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate profile input
	try{
		profileHelper.validateProfileInput(input.profile, false);
	}catch(error){
		throw { name: customError.BAD_REQUEST_ERROR, message: error };
	}

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	let guestFound = false;
	booking.guests.forEach(guest => {
		if (guest._id == input.guestId) {
			guestFound = true;

			//set profile attributes
			guest = profileHelper.setProfile(input.profile, guest);
		}
	});

	if (guestFound == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };
	}

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Edit guest ${input.guestId}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Edit guest(${input.guestId}) to booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	addGuest,
	removeGuest,
	editGuest
}