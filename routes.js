"use strict";
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const wakesurfBookingController = require("./src/wakeSurfBooking/wakesurfBooking.controller");
const staffController = require("./src/staff/staff.controller");
const personController = require("./src/person/person.controller");
const occupancyController = require("./src/occupancy/occupancy.controller");

const worker = require("./worker");

mongoose.connect(process.env.BOOKING_DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => {
		console.log(`Connected to ${process.env.BOOKING_DB_CONNECTION_URL}`);
	})
	.catch(error => {
		logger.error(`Mongoose connection Error: ${error}`);
	});

const router = express.Router();
router.post(`${process.env.API_URL_PREFIX}/booking`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.newBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/confirm`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.confirmBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/cancel`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.cancelBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/fulfill`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.fulfillBooking);
router.get(`${process.env.API_URL_PREFIX}/bookings`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.searchBookings);
router.get(`${process.env.API_URL_PREFIX}/booking/:bookingId`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.findBooking);
router.delete(`${process.env.API_URL_PREFIX}/bookings/:passcode`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.deleteAllBookings);

router.post(`${process.env.API_URL_PREFIX}/booking/staff`, lipslideCommon.authenticateAccessToken, staffController.newStaff);
router.get(`${process.env.API_URL_PREFIX}/booking/staff/:staffId`, lipslideCommon.authenticateAccessToken, staffController.findStaff);
router.delete(`${process.env.API_URL_PREFIX}/booking/staff/:staffId`, lipslideCommon.authenticateAccessToken, staffController.deleteStaff);
router.delete(`${process.env.API_URL_PREFIX}/booking/staffs/:passcode`, lipslideCommon.authenticateAccessToken, staffController.deleteAllStaffs);

router.post(`${process.env.API_URL_PREFIX}/booking/person`, lipslideCommon.authenticateAccessToken, personController.newPerson);
router.get(`${process.env.API_URL_PREFIX}/booking/person/:personId`, lipslideCommon.authenticateAccessToken, personController.findPerson);
router.delete(`${process.env.API_URL_PREFIX}/booking/person/:personId`, lipslideCommon.authenticateAccessToken, personController.deletePerson);
router.delete(`${process.env.API_URL_PREFIX}/booking/persons/:passcode`, lipslideCommon.authenticateAccessToken, personController.deleteAllPersons);

router.post(`${process.env.API_URL_PREFIX}/booking/occupancy`, lipslideCommon.authenticateAccessToken, occupancyController.newOccupancy);
router.get(`${process.env.API_URL_PREFIX}/booking/occupancy/:occupancyId`, lipslideCommon.authenticateAccessToken, occupancyController.findOccupancy);
router.delete(`${process.env.API_URL_PREFIX}/booking/occupancy/:occupancyId`, lipslideCommon.authenticateAccessToken, occupancyController.deleteOccupancy);
router.delete(`${process.env.API_URL_PREFIX}/booking/occupancies/:passcode`, lipslideCommon.authenticateAccessToken, occupancyController.deleteAllOccupancies);

module.exports = router;

worker.listen();