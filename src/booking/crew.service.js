"use strict";
const mongoose = require("mongoose");
const Booking = require("./booking.model").Booking;

const CREW_PATH = "/crew";

async function addCrew(input, user) {
	var response = new Object;
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	if (input.crewId == null || input.crewId.length < 1) {
		response.status = 400;
		response.message = "crewId is mandatory";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find crew
	const url = process.env.OCCUPANCY_DOMAIN + CREW_PATH + "?crewId=" + input.crewId;
	const requestAttr = {
		method: "GET",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + user.accessToken
		}
	}

	var crew;
	await gogowakeCommon.callAPI(url, requestAttr)
		.then(result => {
			crew = result;
		})
		.catch(err => {
			throw err;
		});

	if (crew == null || crew.id == null) {
		response.status = 400;
		response.message = "Invalid crewId";
		throw response;
	}

	//add crew
	if (booking.crews == null) {
		booking.crews = new Array();
	}

	booking.crews.push({
		crewId: crew.id,
		crewName: crew.crewName,
		telephoneCountryCode: crew.telephoneCountryCode,
		telephoneNumber: crew.telephoneNumber,
		assignmentTime: gogowakeCommon.getNowUTCTimeStamp(),
		assignmentBy: user.id
	});

	//add transaction history
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Added new crew : " + input.crewId,
		userId: user.id,
		userName: user.name
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully add guest to booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

module.exports = {
	addCrew
}