const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
require("dotenv").config();

const utility = require("./src/common/utility");
const {logger} = utility;

const bookingRoutes = require("./src/booking/booking.routes");
const pricingRoutes = require("./src/pricing/pricing.routes");
const slotRoutes = require("./src/slot/slot.routes");
const occupancyRoutes = require("./src/occupancy/occupancy.routes");
const staffRoutes = require("./src/staff/staff.routes");
const userRoutes = require("./src/user/user.routes");
const authenticationRoutes = require("./src/authentication/authentication.routes");
const communicationRoutes = require("./src/communication/communication.routes");
const notificationRoutes = require("./src/notification/notification.routes");
const assetRoutes = require("./src/asset/asset.routes");
const personRoutes = require("./src/person/person.routes");
const customerRoutes = require("./src/customer/customer.routes");
const invoiceRoutes = require("./src/invoice/invoice.routes");

const occupancyWorker = require("./src/occupancy/occupancy.worker");
const bookingWorker = require("./src/booking/booking.worker");
const slotWorker = require("./src/slot/slot.worker");
const customerWorker = require("./src/customer/customer.worker");
const manifestWorker = require("./src/manifest/manifest.worker");
const userWorker = require("./src/user/user.worker");
const authenticationWorker = require("./src/authentication/authentication.worker");

const app = express();
app.use(cors());

//set up routes
app.use(express.json());
app.use("/", occupancyRoutes);
app.use("/", pricingRoutes);
app.use("/", bookingRoutes);
app.use("/", slotRoutes);
app.use("/", staffRoutes);
app.use("/", userRoutes);
app.use("/", authenticationRoutes);
app.use("/", communicationRoutes);
app.use("/", notificationRoutes);
app.use("/", assetRoutes);
app.use("/", personRoutes);
app.use("/", customerRoutes);
app.use("/", invoiceRoutes);

app.get('/index.html', function (req, res) {
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

mongoose.connect(process.env.DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => {
		logger.info(`Connected to ${process.env.DB_NAME}`);
	})
	.catch(error => {
		logger.error(`Mongoose connection Error: ${error}`);
	});

app.listen(process.env.PORT, function (err) {
	if (err) {
		logger.error(`Error while starting Booking Services : ${err}`);
		throw err;
	}

	logger.info(`Booking Services started up. Listening to port : ${process.env.PORT}`);
});

occupancyWorker.listen();
bookingWorker.listen();
slotWorker.listen();
customerWorker.listen();
manifestWorker.listen();
userWorker.listen();
authenticationWorker.listen();

//module.exports = app;