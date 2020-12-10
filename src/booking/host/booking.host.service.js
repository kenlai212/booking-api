"use strict";
const moment = require("moment");
const Joi = require("joi");

const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;

const bookingCommon = require("../booking.common");
const profileHelper = require("../../common/profile/profile.helper");
const bookingHistoryHelper = require("../bookingHistory_internal.helper");

async function editHost(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.min(1)
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

	//set host profile attributes
	booking.host = profileHelper.setProfile(input.profile, booking.host);

	//update booking record
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
		transactionDescription: `Updated host profile`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Updated host profile from booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	editHost
}