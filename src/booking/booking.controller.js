"use strict";
const url = require("url");
const bookingService = require("./booking.service");
const common = require("gogowake-common");

require('dotenv').config();

const newBooking = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.addNewBooking(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const makePayment = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.makePayment(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const applyDiscount = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.applyDiscount(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const removeGuest = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.removeGuest(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const addGuest = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.addGuest(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const editGuest = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.editGuest(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const editContact = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.editContact(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const addCrew = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.addCrew(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const cancelBooking = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.cancelBooking(queryObject, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const fulfillBooking = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.fulfillBooking(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const searchBookings = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.viewBookings(queryObject, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const findBooking = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.findBookingById(queryObject, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const sendDisclaimer = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.sendDisclaimer(req.body, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const signDisclaimer = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.signDisclaimer(req.body)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	newBooking,
	makePayment,
	applyDiscount,
	addGuest,
	removeGuest,
	addCrew,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking,
	sendDisclaimer,
	editGuest,
	editContact,
	signDisclaimer
}
