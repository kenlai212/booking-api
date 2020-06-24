"use strict";
const url = require("url");
const bookingService = require("./booking.service");
const common = require("gogowake-common");
const logger = common.logger;

require('dotenv').config();

const newBooking = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.addNewBooking(req.body, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const changePaymentStatus = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await bookingService.changePaymentStatus(req.body, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	newBooking,
	changePaymentStatus,
	addGuest,
	removeGuest,
	addCrew,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking
}