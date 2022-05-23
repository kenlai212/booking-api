"use strict";
const Joi = require("joi");
const { v4: uuidv4 } = require('uuid');
const config = require('config');
const jwt = require("jsonwebtoken");
const moment = require("moment");
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {BadRequestError, ResourceNotFoundError, InternalServerError, DBError} = lipslideCommon;

const utility = require("../utility");
const {WakesurfBooking} = require("./wakesurfBooking.model");
const staffService = require("../staff/staff.service");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const FULFILLED_STATUS = "FULFILLED";
const CANCELLED_STATUS = "CANCELLED";

async function validateNewBookingInput(input){
    utility.validateInput(Joi.object({
        startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required().valid("A24","NXT20"),
        quote: Joi.object({
            price: Joi.number().required(),
            currency:Joi.string().valid("HKD","RMB").required()
        }),
		host:Joi.object({
			personId: Joi.string(),
			name: Joi.string(),
			countryCode: Joi.string(),
			phoneNumber: Joi.string()
		})
		.xor("personId", "name")
        .required(),
		captain: Joi.object({
			staffId: Joi.string().required()
		}),
        crew: Joi.array().min(1).items(
            Joi.object({
                staffId: Joi.string().required()
            })
        ),
        postDate: Joi.boolean(),
        channelId: Joi.string().valid("HOLIMOOD","SALES").required()
	}), input);

    
    if(input.captain){
        let captainStaff;
        captainStaff = await staffService.findStaff({staffId: input.captain.staffId});
	
        if(!captainStaff)
        throw new BadRequestError("Invalid captain.staffId");
    } 

	if(input.crew){
        for(const member of input.crew){
            let crewStaff;
            crewStaff = await staffService.findStaff({staffId: member.staffId});
            
            if(!crewStaff)
            throw new BadRequestError(`Invalid crew.staffId`);
        }
    }

    //helper.validateBookingTime(occupancy.startTime, occupancy.endTime, input.hostPersonId);
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
	throw new ResourceNotFoundError("WakesurfBooking", bookingId);

    return wakesurfBooking;
}

function initWakesurfBooking(input){
    let wakesurfBooking = new WakesurfBooking();
	wakesurfBooking._id = uuidv4();
	wakesurfBooking.creationTime = new Date();
	wakesurfBooking.lastUpdateTime = new Date();
    wakesurfBooking.startTime = lipslideCommon.isoStrToDate(input.startTime, input.utcOffset);
    wakesurfBooking.endTime = lipslideCommon.isoStrToDate(input.endTime, input.utcOffset);
    wakesurfBooking.status = AWAITING_CONFIRMATION_STATUS;
    wakesurfBooking.channelId = input.channelId;
    wakesurfBooking.asset = {
        assetId: input.assetId
    }

    //set quote
    if(input.quote){
        wakesurfBooking.quote = {
            price: input.quote.price,
            currency: input.quote.currency
        }
    }

    //set host
	if(input.host.personId){
		wakesurfBooking.host = {
			personId: input.host.personId
		}
	}else{
		wakesurfBooking.host = {
			name: input.host.name,
			countryCode: input.host.countryCode,
			phoneNumber: input.host.phoneNumber
		}
	}

    //set captain
	if(input.captain){
		wakesurfBooking.captain = {
			staffId: input.captain.staffId
		}
	}

    //set crew
    if(input.crew){
        wakesurfBooking.crew = [];

        input.crew.forEach(member => {
            wakesurfBooking.crew.push({staffId: member.staffId});
        });
    }

    return wakesurfBooking;
}

function validateConfirmBookingInput(input){
    utility.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

}

async function validateFulfillBookingInput(input){
    utility.validateInput(Joi.object({
		bookingId: Joi.string().required(),
        fulfillTime: Joi.object({
            startTime: Joi.date().iso().required(),
            endTime: Joi.date().iso().required(),
            utcOffset: Joi.number().min(-12).max(14).required()
        })
	}), input);

    let wakesurfBooking = await getWakesurfBooking(input.bookingId);

	if (wakesurfBooking.status === FULFILLED_STATUS)
    throw new BadRequestError("Booking already fulfilled");

	if (wakesurfBooking.status === CANCELLED_STATUS)
    throw new BadRequestError("Cannot fulfilled a cancelled booking");

    return wakesurfBooking
}

function setFulfillment(input, wakesurfBooking){
    let startTime;
    let endTime;
    
    if(input.fulfillTime){
        startTime = lipslideCommon.isoStrToDate(input.fulfillTime.startTime, input.fulfillTime.utcOffset);
        endTime = lipslideCommon.isoStrToDate(input.fulfillTime.endTime, input.fulfillTime.utcOffset);
    }else{
        startTime = wakesurfBooking.startTime;
        endTime = wakesurfBooking.endTime;
    }
    
	wakesurfBooking.fulfillment = {
		startTime: startTime,
		endTime: endTime
	}

	wakesurfBooking.status = FULFILLED_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

    return wakesurfBooking;
}

function validateCancelBookingInput(input){
    utility.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);
}

function validateBookingTime(startTime, endTime){
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

function validateFindBookingInput(input){
    utility.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

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
		logger.error(err);
		logger.error("Error while signing access token for Booking API System User", err);
		throw InternalServerError("JWT sign error");
	}
}

function modelToOutput(wakesurfBooking) {
	var outputObj = new Object();
	outputObj.bookingId = wakesurfBooking._id;

	outputObj.creationTime = moment(wakesurfBooking.creationTime).utcOffset(8,true).toDate();
    outputObj.lastUpdateTime = moment(wakesurfBooking.lastUpdateTime).utcOffset(8,true).toDate();
    outputObj.channelId = wakesurfBooking.channelId;
    outputObj.occupancyId = wakesurfBooking.occupancyId;
    outputObj.startTime = wakesurfBooking.startTime;
    outputObj.endTime = wakesurfBooking.endTime;
    outputObj.asset = {
        assetId: wakesurfBooking.asset.assetId
    }

    if(wakesurfBooking.quote && wakesurfBooking.quote.price){
        outputObj.quote = {
            price: wakesurfBooking.quote.price,
            currency: wakesurfBooking.quote.currency
        }
    }

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

    if(wakesurfBooking.crew && wakesurfBooking.crew.length > 0){
        outputObj.crew = []

        wakesurfBooking.crew.forEach(member => {
            outputObj.crew.push({staffId: member.staffId});
        });
    }

	outputObj.status = wakesurfBooking.status;

    if(wakesurfBooking.fulfillment && wakesurfBooking.fulfillment.startTime){
        outputObj.fulfillment = {
            startTime: wakesurfBooking.fulfillment.startTime,
            endTime: wakesurfBooking.fulfillment.endTime
        }
    }

	return outputObj;
}

module.exports = {
    initWakesurfBooking,
    validateNewBookingInput,
    getWakesurfBooking,
    validateConfirmBookingInput,
    validateFulfillBookingInput,
    setFulfillment,
    validateCancelBookingInput,
    validateFindBookingInput,
    validateBookingTime,
    modelToOutput,
    getAccessToken
}