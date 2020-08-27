const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const winston = require("winston");
require("winston-mongodb");

const bookingRoutes = require("./src/booking/booking.routes");
const pricingRoutes = require("./src/pricing/pricing.routes");
const slotRoutes = require("./src/slot/slot.routes");
const occupancyRoutes = require("./src/occupancy/occupancy.routes");
const crewRoutes = require("./src/crew/crew.routes");

const app = express();

//set up routes
app.use(express.json());
app.use("/", occupancyRoutes);
app.use("/", pricingRoutes);
//app.use("/", bookingRoutes);
//app.use("/", slotRoutes);
//app.use("/", crewRoutes);

//set winston transport to console and MongoDB
winston.add(new winston.transports.Console({level: "info"}));
//winston.add(new winston.transports.MongoDB({ db: process.env.DB_CONNECTION_URL}));

//catch all uncaught rejects and excpetions
process.on("unhandledRejection", (ex) => {
	console.log("WE GOT AN UNHANDLED REJECTION!!!!!!!");
	winston.error(ex.message, ex);
});

process.on("uncaughtException", (ex) => {
	console.log("WE GOT AN UNCAUGHT EXCEPTION!!!!!!!");
	winston.error(ex.message, ex);
});

//boot starpping
mongoose.connect(process.env.DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(async () => {
		winston.info("Connected to " + config.get("bootstrap.mongoDBName") + "....");

		await app.listen(process.env.PORT, function (err) {
			if (err) {
				winston.error("Error while starting Booking Services", err);
				throw err;
			}
			winston.info("Booking Services started up. Listening to port " + process.env.PORT);
		});
	})
	.then(() => {

		//generate access token for booking api
		const bookingAPIUser = {
			groups: [
				"OCCUPANCY_ADMIN_GROUP",
				"NOTIFICATION_USER_GROUP"]
		}

		try {
			global.accessToken = jwt.sign(bookingAPIUser, process.env.ACCESS_TOKEN_SECRET);
			winston.info("bookingAPIUser accessToken : " + global.accessToken);
		} catch (err) {
			winston.error("Error while generating access token", err);
			throw err;
		}
	})
	.catch(err => {
		winston.error("Bootup Error", err);
		throw err;
	});

module.exports = app;