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
}
