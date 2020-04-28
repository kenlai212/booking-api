"use strict";
const jwt = require("jsonwebtoken");
const url = require("url");
const helper = require("./helper");
const logger = require("./logger");
const bookingService = require("./booking.service");
const slotService = require("./slot.service");
const pricingService = require("./pricing.service");

require('dotenv').config();

module.exports = function(app){

	//add new booking
	app.post("/booking", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		await bookingService.addNewBooking(req.body, req.user)
			.then(newBooking => {
				res.json(newBooking);
				res.status(200);
			})
			.catch(err => {
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//cancel booking
	app.delete("/booking/:bookingId", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		await bookingService.cancelBooking(req.params.bookingId, req.user)
			.then(() => {
				logger.info("Response body : SUCCESS");
				res.json("SUCCESS");
				res.status(200);	
			})
			.catch(err => {
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//view all bookings
	app.get("/bookings", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		const queryObject = url.parse(req.url, true).query;

		await bookingService.viewBookings(queryObject, req.user)
			.then(bookings => {
				logger.info("Response body : " + JSON.stringify(bookings));
				res.json(bookings);
				res.status(200);
			})
			.catch(err => {
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//find booking by id
	app.get("/booking/:id", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		await bookingService.findBookingById(req.params.id, req.user)
			.then(bookings => {
				logger.info("Response body : " + JSON.stringify(bookings));
				res.json(bookings);
				res.status(200);
			})
			.catch(err => {
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function () {
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//get slots
	app.get("/slots/:targetDate", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		await slotService.getSlots(req.params.targetDate, req.user)
			.then(slots => {
				logger.info("Response body : " + JSON.stringify(slots));
				res.json(slots);
				res.status(200);
			})
			.catch(err => {
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//get end slots
	app.get("/end-slots/:startTime", authenticateToken, async (req, res) => {
		helper.logIncommingRequest(req);

		await slotService.getAvailableEndSlots(req.params.startTime, req.user)
			.then(endSlots => {
				logger.info("Response body : " + JSON.stringify(endSlots));
				res.json(endSlots);
				res.status(200);
			})
			.catch(err => {
				console.log(err);
				res.status(err.status);
				res.statusMessage = err.message;
			});

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//calculate total amount
	app.get("/total-amount/:startTime/:endTime", authenticateToken, (req, res) => {
		helper.logIncommingRequest(req);

		var totalAmountObj;
		try {
			totalAmountObj = pricingService.calculateTotalAmount(req.params.startTime, req.params.endTime, req.user);
			logger.info("Response body : " + JSON.stringify(totalAmountObj));
			res.json(totalAmountObj);
			res.status(200);
		} catch (err) {
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function () {
			helper.logOutgoingResponse(res);
		});

		res.send();
	});
}

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (token == null) {
		return res.sendStatus(401);
	}

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) {
			return res.sendStatus(403);
		}

		req.user = user;

		next();
	})

}
