const express = require("express");
const app = express();

const logger = require("./src/logger");
const initDb = require("./src/db").initDb;
const controller = require("./src/booking.controller");

require('dotenv').config();

app.use(express.json());
controller(app); //register the controller

initDb(function(err){
	app.listen(process.env.PORT, function(err){
		if(err){
			logger.error("Error while starting Booking Services : ", err);
			throw err;
		}
		logger.info("Booking Services started up. Listening to port " + process.env.PORT);
	});
});