"use strict";
const url = require("url");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const bookingService = require("./booking.service");;

const newBooking = asyncMiddleware(async (req) => {
	return await bookingService.addNewBooking(req.body, req.user);
});

const editContact = async (req) => {
	return await bookingService.editContact(req.body, req.user);
}

const cancelBooking = async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await bookingService.cancelBooking(queryObject, req.user);
}

const fulfillBooking = async (req) => {
	return await bookingService.fulfillBooking(req.body, req.user);
}

const searchBookings = async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await bookingService.viewBookings(queryObject, req.user);
}

const findBooking = async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await bookingService.findBookingById(queryObject, req.user);
}

module.exports = {
	newBooking,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking,
	editContact
}
