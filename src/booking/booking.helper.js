"use strict";
const moment = require("moment");

const utility = require("../common/utility");
const {customError} = utility;

const occupancyDomain = require("./occupancy.domain");

async function validateOccupancyId(occupancyId){
    let occupancy = await occupancyDomain.readOccupancy(occupancyId);

    return occupancy;
}

function validateBookingType(bookingType){
    const validBookingTypes = [ "CUSTOMER_BOOKING", "OWNER_BOOKING" ];

    if(!validBookingTypes.includes(bookingType))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingType" };
}

function validateAssetId(assetId){
    if(assetId != "MC_NXT20")
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
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

function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.bookingId = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.requestorId = booking.requestorId;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.customerId = booking.customerId;
	outputObj.status = booking.status;

	return outputObj;
}

module.exports = {
    validateOccupancyId,
    validateAssetId,
    validateBookingType,
    validateBookingTime,
    bookingToOutputObj
}