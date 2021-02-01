const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require('cors');
require("dotenv").config();

const logger = require("./src/common/logger").logger;
const bookingAPIUser = require("./src/common/bookingAPIUser")
const bookingRoutes = require("./src/booking/booking.routes");
const pricingRoutes = require("./src/pricing/pricing.routes");
const slotRoutes = require("./src/slot/slot.routes");
const occupancyRoutes = require("./src/occupancy/occupancy.routes");
const crewRoutes = require("./src/crew/crew.routes");
const userRoutes = require("./src/user/user.routes");
const authenticationRoutes = require("./src/authentication/authentication.routes");
const communicationRoutes = require("./src/communication/communication.routes");
const notificationRoutes = require("./src/notification/notification.routes");
const assetRoutes = require("./src/asset/asset.routes");
const bookingHistoryRoutes = require("./src/bookingHistory/bookingHistroy.routes");
const partyRoutes = require("./src/party/party.routes");
const customerRoutes = require("./src/customer/customer.routes");
const invoiceRoutes = require("./src/invoice/invoice.routes");

const app = express();
app.use(cors());

//set up routes
app.use(express.json());
app.use("/", occupancyRoutes);
app.use("/", pricingRoutes);
app.use("/", bookingRoutes);
app.use("/", slotRoutes);
app.use("/", crewRoutes);
app.use("/", userRoutes);
app.use("/", authenticationRoutes);
app.use("/", communicationRoutes);
app.use("/", notificationRoutes);
app.use("/", assetRoutes);
app.use("/", bookingHistoryRoutes);
app.use("/", partyRoutes);
app.use("/", customerRoutes);
app.use("/", invoiceRoutes);

app.get('/', function (req, res) {
	res.send("Booking API Running.....");
 })

//catch all uncaught rejects and excpetions
process.on("unhandledRejection", (ex) => {
	console.log("WE GOT AN UNHANDLED REJECTION!!!!!!!");
	logger.error(ex.message, ex);
});

process.on("uncaughtException", (ex) => {
	console.log("WE GOT AN UNCAUGHT EXCEPTION!!!!!!!");
	logger.error(ex.message, ex);
});

//boot starpping
mongoose.connect(process.env.DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(async () => {
		logger.info("Connected to " + config.get("bootstrap.mongoDBName") + "....");

		await app.listen(process.env.PORT, function (err) {
			if (err) {
				logger.error("Error while starting Booking Services", err);
				throw err;
			}
			logger.info("Booking Services started up. Listening to port " + process.env.PORT);
		});
	})
	.then(() => {
		//generate access token for booking api
		logger.info("bookingAPIUser accessToken : " + bookingAPIUser.getAccessToken());
	})
	.catch(err => {
		logger.error("Bootup Error", err);
		throw err;
	});

module.exports = app;