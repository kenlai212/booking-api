
"use strict";
const url = require("url");
const helper = require("./helper");
const logger = require("./logger");
const bookingService = require("./booking.service");

require('dotenv').config();

const newBooking = async (req, res) => {
	helper.logIncommingRequest(req);

	try {
		const response = await bookingService.addNewBooking(req.body, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		helper.logOutgoingResponse(res);
	});

	return res;
}

const cancelBooking = async (req, res) => {
	helper.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.cancelBooking(queryObject, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		helper.logOutgoingResponse(res);
	});

	return res;
}

const searchBookings = async (req, res) => {
	helper.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.viewBookings(queryObject, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		helper.logOutgoingResponse(res);
	});

	return res;
}

const findBooking = async (req, res) => {
	helper.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await bookingService.findBookingById(queryObject, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		helper.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	newBooking,
	cancelBooking,
	searchBookings,
	findBooking
}
