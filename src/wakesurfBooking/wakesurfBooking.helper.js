"use strict";
const axios = require("axios");
require("dotenv").config();
const moment = require("moment");

const lipslideCommon = require("lipslide-common");
const {customError} = lipslideCommon;

const personService = require("../person/person.service");
const staffService = require("../staff/staff.service");
const occupancyService = require("../occupancy/occupancy.service");

async function validateOccupancyId(occupancyId){
    const occupancy = await occupancyService.findOccupancy({occupancyId: occupancyId});

    if(occupancy.status != "AWAIT_CONFIRMATION")
    throw{ name: customError.BAD_REQUEST_ERROR, message: "Occupancy not available"};

    if(occupancy.referenceId)
    throw{ name: customError.BAD_REQUEST_ERROR, message: "Occupancy not available"};

    return occupancy;
}

async function validatePersonId(personId){
    await personService.findPerson({personId: personId});
}

async function validateStaffId(staffId){
    await staffService.findStaff({staffId: staffId});
}

function validateBookingTime(startTime, endTime, hostPersonId){
    if (startTime > endTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	if (startTime < moment().toDate() || endTime < moment().toDate())
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking time cannot be in the past" };

	//TODO check hostPersonId for special rules
    //TODO checkMinimumDuration(startTime, endTime);
    //TODO checkMaximumDurattion(startTime, endTime);
    //TODO checkEarliestStartTime(startTime, utcOffset);
    //TODO checkLatestEndTime(endTime, utcOffset);
}

function checkMinimumDuration(startTime, endTime){
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

async function modelToOutput(wakesurfBooking) {
	var outputObj = new Object();
	outputObj.bookingId = wakesurfBooking._id;
	outputObj.creationTime = wakesurfBooking.creationTime;
    outputObj.lastUpdateTime = wakesurfBooking.lastUpdateTime;
    outputObj.occupancyId = wakesurfBooking.occupancyId;
	outputObj.hostPersonId = wakesurfBooking.hostPersonId;
    outputObj.captainStaffId = wakesurfBooking.captainStaffId;
	outputObj.status = wakesurfBooking.status;

	return outputObj;
}

module.exports = {
    validateOccupancyId,
    validatePersonId,
    validateStaffId,
    validateBookingTime,
    modelToOutput
}