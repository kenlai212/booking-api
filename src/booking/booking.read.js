"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking} = require("./booking.model");

async function viewBookings(input, user) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
	});
	utility.validateInput(schema, input);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then endTime" };
	}
	
	let bookings;
	try {
		bookings = await Booking.find(
			{
				startTime: { $gte: startTime },
				endTime: { $lt: endTime }
			})
			.sort("startTime");
	} catch (err) {
		logger.error("Booking.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	var outputObjs = [];
	for (const booking of bookings) {
		const outputObj = await bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	}
	
	return {
		"count": outputObjs.length,
		"bookings": outputObjs
	};
}

async function findBookingById(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!booking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	
	return bookingToOutputObj(booking);
}

async function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.status = booking.status;

	//set time
	outputObj.startTime = booking.startTime;
	outputObj.endTime = booking.endTime;
	outputObj.durationByHours = bookingDurationHelper.calculateTotalDuration(booking.startTime, booking.endTime);
	outputObj.fulfilledHours = booking.fulfilledHours;
	
	//set host
	if(booking.host && booking.host.customerId){
		outputObj.host = new Object();
		outputObj.host.customerId = booking.host.customerId;
	
		let targetCustomer;
		try{
			targetCustomer = await customerHelper.findCustomer({id: booking.host.customerId}, bookingAPIUser.userObject);
		}catch(error){
			logger.error("booking.common.bookingToOutputObj() customerHelper.findCustomer", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}
		
		outputObj.host.personalInfo = targetCustomer.personalInfo;
		outputObj.host.contact = targetCustomer.contact;
		outputObj.host.picture = targetCustomer.picture;
	}

	//set guests
	if(booking.guests){
		outputObj.guests = [];
		for(const guest of booking.guests){
			let tempGuest = new Object();
			tempGuest.customerId = guest._id;
			tempGuest.disclaimerId = guest.disclaimerId;
			tempGuest.signedDisclaimerTimeStamp = guest.signedDisclaimerTimeStamp;
			
			let targetCustomer;
			try{
				targetCustomer = await customerHelper.findCustomer({id: guest._id}, bookingAPIUser.userObject);
			}catch(error){
				logger.error("booking.common.bookingToOutputObj() customerHelper.findCustomer", error);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}
	
			tempGuest.personalInfo = targetCustomer.personalInfo;
			tempGuest.contact = targetCustomer.contact;
			tempGuest.picture = targetCustomer.picture;

			outputObj.guests.push(tempGuest);
		}
	}
	
	//set crews
	if (booking.crews && booking.crews.length > 0) {
		outputObj.crews = [];

		for(const crew of booking.crews){
			let tempCrew = new Object();
			tempCrew.id = crew._id;
			tempCrew.assignmentTime = crew.assignmentTime;
			tempCrew.assignmentBy = crew.assignmentBy;
	
			let targetCrew;
			try{
				targetCrew = await crewHelper.getCrew(crew._id);
			}catch(error){
				logger.error("booking.common.bookingToOutputObj() crewHelper.getCrew", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
			}

			tempCrew.personalInfo = targetCrew.personalInfo;
			tempCrew.contact = targetCrew.contact;
			tempCrew.picture = targetCrew.picture;

			outputObj.crews.push(tempCrew);
		}
	}

	return outputObj;
}

module.exports = {
	viewBookings,
	findBookingById
}