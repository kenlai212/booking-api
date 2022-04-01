"use strict";
const config = require('config');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();
const moment = require("moment");

const lipslideCommon = require("lipslide-common");
const {BadRequestError, InternalServerError, ResourceNotFoundError, DBError} = lipslideCommon;

const {WakesurfBooking} = require("./wakesurfBooking.model");

const RESERVED_STATUS = "RESERVED";

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw new BadRequestError(lipslideCommon.translateJoiValidationError(result.error))
	}
}

async function validateOccupancyId(occupancyId){
    let occupancy; 
    
    try{
        const url = `${config.get("api.occupancyApi")}/occupancy/${occupancyId}`;
        const response = await axios.get(url, {headers:{'Authorization': `token ${getAccessToken()}`}});
        occupancy = response.data;
    }catch(error){
        if(error.response.status == 400)
        throw new ResourceNotFoundError("Occupancy", occupancyId);
        else
        throw new InternalServerError(error, "Occupancy API not available");
    }

    if(occupancy.status != RESERVED_STATUS)
    throw new BadRequestError("Occupancy not available");

    if(occupancy.referenceId)
    throw new BadRequestError("Occupancy not available")

    return occupancy;
}

async function getWakesurfBooking(bookingId){
	if(mongoose.connection.readyState != 1)
    lipslideCommon.initMongoDb();

	let wakesurfBooking;
	
	try{
		wakesurfBooking = await WakesurfBooking.findById(bookingId);
	}catch(error){
		throw new DBError(error);
	}
	
	if(!wakesurfBooking)
	throw new ResourceNotFoundError("WaksurfBooking", input);

	return wakesurfBooking;
}

function validateBookingTime(startTime, endTime, hostPersonId){
    if (startTime > endTime)
    throw new BadRequestError("endTime cannot be earlier then startTime");

    if (startTime == endTime)
    throw new BadRequestError("endTime cannot be same as startTime");

	if (startTime < moment().toDate() || endTime < moment().toDate())
    throw new BadRequestError("Booking time cannot be in the past");

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

function getAccessToken() {
	const userObject = {
		userId: "TESTER1",
		personId: "Tester 1",
		userStatus: "ACTIVE",
		groups: [
			"AUTHENTICATION_ADMIN",
			"BOOKING_ADMIN",
			"PRICING_USER",
			"OCCUPANCY_ADMIN",
			"NOTIFICATION_USER",
			"USER_ADMIN",
			"ASSET_ADMIN",
			"STAFF_ADMIN",
			"PERSON_ADMIN",
			"CUSTOMER_ADMIN",
			"INVOICE_ADMIN"]
	}

	try {
		return jwt.sign(userObject, "azize-lights");
	} catch (err) {
		console.error(err);
		console.error("Error while signing access token for Booking API System User", err);
		throw err;
	}
}

function modelToOutput(wakesurfBooking) {
	var outputObj = new Object();
	outputObj.bookingId = wakesurfBooking._id;
	outputObj.creationTime = wakesurfBooking.creationTime;
    outputObj.lastUpdateTime = wakesurfBooking.lastUpdateTime;
    outputObj.occupancyId = wakesurfBooking.occupancyId;
    outputObj.host = {
        personId: wakesurfBooking.host.personId,
        name: wakesurfBooking.host.name,
        countryCode: wakesurfBooking.host.countryCode,
        phoneNumber: wakesurfBooking.host.phoneNumber
    }

    if(wakesurfBooking.captain && wakesurfBooking.captain.staffId){
        outputObj.captain = {
            staffId: wakesurfBooking.captain.staffId
        }
    }
	outputObj.status = wakesurfBooking.status;

	return outputObj;
}

module.exports = {
    validateInput,
    getWakesurfBooking,
    validateOccupancyId,
    validateBookingTime,
    modelToOutput,
    getAccessToken
}