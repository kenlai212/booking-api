"use strict";
const url = require("url");
const bookingService = require("./booking.service");
const gogowakeCommon = require("gogowake-common");

const newBooking = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await bookingService.addNewBooking(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const editContact = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await bookingService.editContact(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const cancelBooking = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.cancelBooking(queryObject, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const fulfillBooking = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await bookingService.fulfillBooking(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const searchBookings = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.viewBookings(queryObject, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const findBooking = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.findBookingById(queryObject, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	newBooking,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking,
	editContact
}
