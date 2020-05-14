const express = require("express");
const logger = require("./src/logger");
const mongoose = require("mongoose")
const bookingRoutes = require("./src/booking.routes");
const pricingRoutes = require("./src/pricing.routes");
const slotRoutes = require("./src/slot.routes");
const helper = require("./src/helper");

require('dotenv').config();

const app = express();
app.use(express.json());
app.use("/", bookingRoutes);
app.use("/", pricingRoutes);
app.use("/", slotRoutes);

const PORT = 8084;

mongoose.connect(process.env.DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(async () => {

		app.listen(process.env.PORT, function (err) {
			if (err) {
				logger.error("Error while starting Booking Services : ", err);
				throw err;
			}
			logger.info("Booking Services started up. Listening to port " + process.env.PORT);
		});
	})
	.catch(err => {
		logger.error("Error while connecting to MongoDB : " + err);
	});

module.exports = app;