"use strict";
const jwt = require("jsonwebtoken");

const helper = require("./helper");
const logger = require("./logger");
const bookingService = require("./booking.service");
require('dotenv').config();

module.exports = function(app){

	//add new booking
	app.post("/booking", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const newBooking = await bookingService.addNewBooking(req.body);
			res.json(newBooking);
			res.status(200);
		}catch(err){
			logger.error("Error while calling bookingService.addNewBooking() : ", err);
			res.status(err.status);
			res.json({ message: err.message });
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});
	});

	//cancel booking
	app.delete("/booking/:bookingId", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			await bookingService.cancelBooking(req.params.bookingId);
			res.json("SUCCESS");
			res.status(200);
		}catch(err){
			logger.error("Error while calling bookingService.cancelBooking() : ", err);
			res.status(err.status);
			res.json({ message: err.message });
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});
	});

	//view all bookings
	app.get("/bookings", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const bookings = await bookingService.viewBookings(req.body);
			res.json(bookings);
			res.status(200);
		}catch(err){
			logger.error("Error while calling bookingService.viewBookings() : ", err);
			res.status(err.status);
			res.json({ message: err.message });
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});
	});
}
