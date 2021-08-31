"use strict";
const axios = require("axios");
require("dotenv").config();
const moment = require("moment");

const lipslideCommon = require("lipslide-common");
const {customError} = lipslideCommon;

const customerService = require("../customer/customer.service");
const staffService = require("../staff/staff.service");
const boatService = require("../boat/boat.service");
const Joi = require("joi");

async function validateCustomerId(customerId){
    await customerService.findCustomer({customerId: customerId});
}

async function validateStaffId(staffId){
    await staffService.findStaff({staffId: staffId});
}

async function validateBoatId(assetId){
    await boatService.findBoat({boatId: boatId});
}

function validateBookingTime(startTime, endTime, bookingType){
    if (startTime > endTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	if (startTime < moment().toDate() || endTime < moment().toDate())
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking time cannot be in the past" };

	// if (bookingType === CUSTOMER_BOOKING_TYPE) {
	// 	//check minimum booking duration, maximum booking duration, earliest startTime
	// 	try {
	// 		checkMimumDuration(startTime, endTime);
	// 		checkMaximumDuration(startTime, endTime);
	// 		checkEarliestStartTime(startTime, UTC_OFFSET);
	// 		checkLatestEndTime(endTime, UTC_OFFSET);
	// 	} catch (err) {
	// 		throw { name: customError.BAD_REQUEST_ERROR, message: err };
	// 	}
	// }
}

function checkMimumDuration(startTime, endTime){
    const diffMs = (endTime - startTime);
    const minMs = config.get("booking.minimumBookingDuration");

    if (diffMs < minMs) {
        var minutes = Math.floor(minMs / 60000);
        var seconds = ((minMs % 60000) / 1000).toFixed(0);

        throw "Booking cannot be less then " + minutes + " mins " + seconds + " secs";
    }

    return true;
}

function checkMaximumDuration(startTime, endTime){
    const diffMs = (endTime - startTime);
    const maxMs = config.get("booking.maximumBookingDuration");

    if (diffMs > maxMs) {
        var minutes = Math.floor(maxMs / 60000);
        var seconds = ((maxMs % 60000) / 1000).toFixed(0);

        throw "Booking cannot be more then " + minutes + " mins " + seconds + " secs";
    }

    return true;
}

function checkEarliestStartTime(startTime, utcOffset){
    const earlistBookingHour = config.get("booking.earliestBooking.hour");
    const earlistBookingMinute = config.get("booking.earliestBooking.minute");

    var earliestStartTime = moment(startTime).utcOffset(utcOffset).set({ hour: earlistBookingHour, minute: earlistBookingMinute });

    if (startTime < earliestStartTime) {
        throw "Booking cannot be earlier then " + ("0" + earlistBookingHour).slice(-2) + ":" + ("0" + earlistBookingMinute).slice(-2);
    }
    
    return true;
}

function checkLatestEndTime(endTime, utcOffset){
    const latestBookingHour = config.get("booking.latestBooking.hour");
    const latestBookingMinute = config.get("booking.latestBooking.minute");

    var latestEndTime = moment(endTime).utcOffset(utcOffset).set({ hour: latestBookingHour, minute: latestBookingMinute });

    if (endTime > latestEndTime) {
        throw "Booking cannot be later then " + ("0" + latestBookingHour).slice(-2) + ":" + ("0" + latestBookingMinute).slice(-2);
    }

    return true;
}

function calculateTotalDuration(startTime, endTime){
    const diffTime = Math.abs(endTime - startTime);
	const durationByMinutes = Math.ceil(diffTime / (1000 * 60));
	return Math.round((durationByMinutes / 60) * 2) / 2;
}

async function occupyAsset(input){
    const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
        assetType: Joi.string().required(),
		assetId: Joi.string().required(),
		referenceType: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	input.startTime = input.startTime.toISOString();
	input.endTime = input.endTime.toISOString();

    let postOccupancyResult;

    try{
        const token = getAccessToken();
        postOccupancyResult = await axios.post(`${process.env.OCCUPANCY_API_URL_PREFIX}/occupancy`, input, {headers:{'Authorization': `token ${token}`}});
    }catch(error){
        logger.error("Failed to call postOccupancy API");
        logger.error(error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "POST OCCUPANCY API Error" };
    }
    return postOccupancyResult.data;
}

function getAccessToken() {
	const userObject = {
		userId: "BOOKING_SYSTEM_1",
		personId: "Booking Api System Account",
		userStatus: "ACTIVE",
		groups: ["OCCUPANCY_ADMIN"]
	}

	try {
		return jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET);
	} catch (err) {
		logger.error("Error while signing access token for API System User", err);
        logger.error(err);
		throw err;
	}
}

function modelToOutput(booking) {
	var outputObj = new Object();
	outputObj.bookingId = booking._id;
	outputObj.creationTime = booking.creationTime;
    outputObj.lastUpdateTime = booking.lastUpdateTime;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.hostCustomerId = booking.hostCustomerId;
    outputObj.captainStaffId = booking.captainStaffId;
	outputObj.status = booking.status;

	return outputObj;
}

module.exports = {
    validateCustomerId,
    validateStaffId,
    validateBoatId,
    validateBookingTime,
    modelToOutput,
    occupyAsset
}