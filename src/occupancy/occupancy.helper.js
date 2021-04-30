"use strict";
const moment = require("moment");

const utility = require("../common/utility");
const {logger, customError} = utility;

//const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING"

async function checkAvailability(startTime, endTime, occupancies) {
	//find all occupancies with in search start and end time
	//expand search range to -1 day from startTime and +1 from endTime 
	const searchTimeRangeStart = moment(startTime).subtract(1, 'days');
	const searchTimeRangeEnd = moment(endTime).add(1, 'days');

 	//check if the time between startTime and endTime will
 	//overlap any entries in occupancies array.
 	//Returns ture or false
	var isAvailable = true;
	
	occupancies.forEach((item) => {
		if ((startTime >= item.startTime && startTime <= item.endTime) ||
			(endTime >= item.startTime && endTime <= item.endTime) ||
			(startTime <= item.startTime && endTime >= item.endTime)) {
			isAvailable = false;
		}
	});
	
	return isAvailable;
}

function validateOccupancyTime(startTime, endTime, bookingType){
    if (startTime > endTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	if (startTime < moment().toDate() || endTime < moment().toDate())
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Occupancy cannot be in the past" };

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

function validateAssetId(assetId){
	const validAssetIds = [ "A001", "MC_NXT20" ];

	if(!validAssetIds.includes(assetId))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

function validateReferenceType(bookingType){
	const validReferenceTypes = [
		"BOOKING",
		"MAINTAINANCE"
	]

	if(!validReferenceTypes.includes(bookingType))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid referenceType" };
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

module.exports = {
	checkAvailability,
	validateOccupancyTime,
	validateAssetId,
	validateReferenceType
}