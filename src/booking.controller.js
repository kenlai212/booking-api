"use strict";
const jwt = require("jsonwebtoken");

const helper = require("./helper");
const logger = require("./logger");
const bookingService = require("./booking.service");
const slotService = require("./slot.service");
require('dotenv').config();

module.exports = function(app){

	//add new booking
	app.post("/booking", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const newBooking = await bookingService.addNewBooking(req.body);
			logger.info("Response body : " + JSON.stringify(newBookine));
			res.json(newBooking);
			res.status(200);
		}catch(err){
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//cancel booking
	app.delete("/booking/:bookingId", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			await bookingService.cancelBooking(req.params.bookingId);
			logger.info("Response body : SUCCESS");
			res.json("SUCCESS");
			res.status(200);
		}catch(err){
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//view all bookings
	app.post("/bookings", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const bookings = await bookingService.viewBookings(req.body);
			logger.info("Response body : " + JSON.stringify(bookings));
			res.json(bookings);
			res.status(200);
		}catch(err){
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//get slots
	app.post("/slots", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const slots = await slotService.getSlots(req.body);
			logger.info("Response body : " + JSON.stringify(slots));
			res.json(slots);
			res.status(200);
		}catch(err){
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});

	//get end slots
	app.post("/end-slots", async (req, res) => {
		helper.logIncommingRequest(req);

		try{
			const endSlots = await slotService.getAvailableEndSlots(req.body);
			logger.info("Response body : " + JSON.stringify(endSlots));
			res.json(endSlots);
			res.status(200);
		}catch(err){
			res.status(err.status);
			res.statusMessage = err.message;
		}

		res.on("finish", function(){
			helper.logOutgoingResponse(res);
		});

		res.send();
	});
}
