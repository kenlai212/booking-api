const express = require("express");
const app = express();

const logger = require("./src/logger");
const initDb = require("./src/db").initDb;
const controller = require("./src/booking.controller");
const helper = require("./src/helper");

require('dotenv').config();

app.use(express.json());
controller(app); //register the controller

initDb(function(err){
	app.listen(process.env.PORT, async function(err){
		if(err){
			logger.error("Error while starting Booking Services : ", err);
			throw err;
		}

		logger.info("Booking Services started up. Listening to port " + process.env.PORT);

		var loginResponse;
		await helper.callLoginAPI()
			.then(response => {
				loginResponse = response;
			})
			.catch(err => {
				throw err;
			});

		global.accessToken = loginResponse.accessToken;
		logger.info("Obtained accessToken : " + global.accessToken);

		global.refreshToken = loginResponse.refreshToken;
		logger.info("Obtained refreshToken : " + global.refreshToken);

	});
});