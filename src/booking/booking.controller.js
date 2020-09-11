"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const bookingService = require("./booking.service");;

const newBooking = asyncMiddleware(async (req) => {
	return await bookingService.addNewBooking(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	return await bookingService.editContact(req.body, req.user);
});

const cancelBooking = asyncMiddleware(async (req) => {
	return await bookingService.cancelBooking(req.body, req.user);
});

const fulfillBooking = asyncMiddleware(async (req) => {
	return await bookingService.fulfillBooking(req.body, req.user);
});

const searchBookings = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await bookingService.viewBookings(queryObject, req.user);
});

const findBooking = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await bookingService.findBookingById(queryObject, req.user);
});

module.exports = {
	newBooking,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking,
	editContact
}
