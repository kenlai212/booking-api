"use strict";
const config = require('config');
const axios = require("axios");
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {DBError, InternalServerError, BadRequestError} = lipslideCommon;
const utility = require("../utility");
const {WakesurfBooking} = require("./wakesurfBooking.model");
const helper = require("./wakesurfBooking.helper");

const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

async function newBooking(input) {
	helper.validateNewBookingInput(input);
	
	if(input.captain)
	helper.validateCaptainStaffId(input.captain.staffId);
	//helper.validateBookingTime(occupancy.startTime, occupancy.endTime, input.hostPersonId);

	//call reserveAsset occupancy api
	let postOccupancyResponse;
	const postOccupancyRequest = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetType: "BOAT",
		assetId: input.assetId,
        referenceType: "WAKESURF_BOOKING",
		postDate: input.postDate
    }
    try{
        postOccupancyResponse = await axios.post(`${config.get("api.occupancyApi")}/occupancy`, postOccupancyRequest, {headers:{'Authorization': `token ${helper.getAccessToken()}`}});
    }catch(error){
        throw new InternalServerError(error, "Occupancy API not available");
    }

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();
	
	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	let wakesurfBooking = helper.initWakesurfBooking(input, postOccupancyResponse.data.occupancyId);
	
	//if failed save wakesurfBooking record, publish FAILED_BOOKING so occupancyApi can release the occupancy
	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}

	const output = helper.modelToOutput(wakesurfBooking);

	//publish NEW_BOOKING event
	const messageStr = JSON.stringify(output);
	try{
		await lipslideCommon.publishToKafkaTopic(config.get("kafka.clientId"), config.get("kafka.brokers").split(","), config.get("kafka.topics.newBooking"), [{"value": messageStr}]);
	}catch(error){
		await session.abortTransaction();
		throw new InternalServerError(error, `Event Source not available`);
	}

	await session.commitTransaction();
	await session.endSession();

	return output;
}

async function confirmBooking(input){
	helper.validateConfirmBookingInput(input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);

	wakesurfBooking.status = CONFIRMED_BOOKING_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}
	
	const output = helper.modelToOutput(wakesurfBooking);
	const messageStr = JSON.stringify(output);
	
	try{
		await lipslideCommon.publishToKafkaTopic(config.get("kafka.clientId"), config.get("kafka.brokers").split(","), config.get("kafka.topics.confirmBooking"), [{"value": messageStr}]);
	}catch(error){
		await session.abortTransaction();
		throw new InternalServerError(error, `Event Source not available`);
	}

	await session.commitTransaction();
	await session.endSession();

	return output;
}

async function fulfillBooking(input) {
	helper.validateFulfillBookingInput(input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);

	if (wakesurfBooking.status === FULFILLED_STATUS)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (wakesurfBooking.status === CANCELLED_STATUS)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	wakesurfBooking.status = FULFILLED_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}

	const output = helper.modelToOutput(wakesurfBooking);
	const messageStr = JSON.stringify(output);
	
	try{
		await lipslideCommon.publishToKafkaTopic(config.get("kafka.clientId"), config.get("kafka.brokers").split(","), config.get("kafka.topics.confirmBooking"), [{"value": messageStr}]);
	}catch(error){
		await session.abortTransaction();
		throw new InternalServerError(error, `Event Source not available`);
	}

	await session.commitTransaction();
	await session.endSession();

	return output;
}

async function cancelBooking(input) {
	helper.validateCancelBookingInput(input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);

	if (wakesurfBooking.status === CANCELLED_STATUS)
	throw new BadRequestError("Booking already cancelled");

	if (wakesurfBooking.status === FULFILLED_STATUS)
	throw new BadRequestError("Cannot cancel an already fulfilled booking");

	wakesurfBooking.status = CANCELLED_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();
	wakesurfBooking.occupancyId = undefined;

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}
	const output = helper.modelToOutput(wakesurfBooking);

	//call release occupancy api
    try{
        await axios.delete(`${config.get("api.occupancyApi")}/occupancy/${output.occupancyId}`, {headers:{'Authorization': `token ${helper.getAccessToken()}`}});
    }catch(error){
		await session.abortTransaction();
        throw new InternalServerError(error, "Occupancy API not available");
    }
	
	const messageStr = JSON.stringify(output);
	try{
		await lipslideCommon.publishToKafkaTopic(config.get("kafka.clientId"), config.get("kafka.brokers").split(","), config.get("kafka.topics.cancelBooking"), [{"value": messageStr}]);
	}catch(error){
		await session.abortTransaction();
		throw new InternalServerError(error, `Event Source not available`);
	}

	await session.commitTransaction();
	await session.endSession();

	return output;
}

async function findBooking(input) {
	helper.validateFindBookingInput(input);

	const wakesurfBooking = helper.getWakesurfBooking(input.bookingId);
	
	return helper.modelToOutput(wakesurfBooking);
}

async function searchBookings(input){
	try{
		return await WakesurfBooking.find();
	}catch(error){
		throw new DBError(error)
	}
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	findBooking,
	searchBookings
}