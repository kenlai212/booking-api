"use strict";
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const bookingController = require("./src/wakeSurfBooking/wakesurfBooking.controller");
const customerController = require("./src/customer/customer.controller");
const staffController = require("./src/staff/staff.controller");
const boatController = require("./src/boat/boat.controller");

const worker = require("./worker");

mongoose.connect(process.env.BOOKING_DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => {
		console.log(`Connected to ${process.env.BOOKING_DB_CONNECTION_URL}`);
	})
	.catch(error => {
		logger.error(`Mongoose connection Error: ${error}`);
	});

const router = express.Router();
router.post(`${process.env.API_URL_PREFIX}/booking`, lipslideCommon.authenticateAccessToken, bookingController.newBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/confirm`, lipslideCommon.authenticateAccessToken, bookingController.confirmBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/cancel`, lipslideCommon.authenticateAccessToken, bookingController.cancelBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/fulfill`, lipslideCommon.authenticateAccessToken, bookingController.fulfillBooking);
router.get(`${process.env.API_URL_PREFIX}/bookings`, lipslideCommon.authenticateAccessToken, bookingController.searchBookings);
router.get(`${process.env.API_URL_PREFIX}/booking/:bookingId`, lipslideCommon.authenticateAccessToken, bookingController.findBooking);
router.delete(`${process.env.API_URL_PREFIX}/bookings/:passcode`, lipslideCommon.authenticateAccessToken, bookingController.deleteAllBookings);

router.post(`${process.env.API_URL_PREFIX}/booking/customer`, lipslideCommon.authenticateAccessToken, customerController.newCustomer);
router.get(`${process.env.API_URL_PREFIX}/booking/customer/:customerId`, lipslideCommon.authenticateAccessToken, customerController.findCustomer);
router.delete(`${process.env.API_URL_PREFIX}/booking/customers/:passcode`, lipslideCommon.authenticateAccessToken, customerController.deleteAllCustomers);

router.post(`${process.env.API_URL_PREFIX}/booking/staff`, lipslideCommon.authenticateAccessToken, staffController.newStaff);
router.get(`${process.env.API_URL_PREFIX}/booking/staff/:staffId`, lipslideCommon.authenticateAccessToken, staffController.findStaff);
router.delete(`${process.env.API_URL_PREFIX}/booking/staffs/:passcode`, lipslideCommon.authenticateAccessToken, staffController.deleteAllStaffs);

router.post(`${process.env.API_URL_PREFIX}/booking/staff`, lipslideCommon.authenticateAccessToken, boatController.newBoat);
router.get(`${process.env.API_URL_PREFIX}/booking/staff/:staffId`, lipslideCommon.authenticateAccessToken, boatController.findBoat);
router.delete(`${process.env.API_URL_PREFIX}/booking/staffs/:passcode`, lipslideCommon.authenticateAccessToken, boatController.deleteAllBoats);

module.exports = router;

worker.listen();