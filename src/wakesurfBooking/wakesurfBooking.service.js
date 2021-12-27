"use strict";
const Joi = require("joi");
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {logger, DBError, ResourceNotFoundError, UnauthorizedError, InternalServerError, BadRequestError} = lipslideCommon;

const {WakesurfBooking} = require("./wakesurfBooking.model");
const helper = require("./wakesurfBooking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

async function newBooking(input) {
	helper.validateInput(Joi.object({
		occupancyId: Joi.string().required(),
		hostPersonId: Joi.string().required(),
		captainStaffId: Joi.string()
	}), input);

	const occupancy = await helper.validateOccupancyId(input.occupancyId);

	helper.validateBookingTime(occupancy.startTime, occupancy.endTime, input.hostPersonId);

	if(mongoose.connection.readyState != 1)
    lipslideCommon.initMongoDb(process.env.BOOKING_DB_CONNECTION_URL);
	
	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	let wakesurfBooking = new WakesurfBooking();
	wakesurfBooking._id = uuidv4();
	wakesurfBooking.creationTime = new Date();
	wakesurfBooking.lastUpdateTime = new Date();
	wakesurfBooking.occupancyId = occupancy.occupancyId;
	wakesurfBooking.status = AWAITING_CONFIRMATION_STATUS;
	wakesurfBooking.hostPersonId = input.hostPersonId;
	if(input.captainStaffId)
	wakesurfBooking.captainStaffId = input.captainStaffId;
	
	//if failed save wakesurfBooking record, publish FAILED_BOOKING so occupancyApi can release the occupancy
	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		await session.abortTransaction();
		throw new DBError(error);
	}

	const output = helper.modelToOutput(wakesurfBooking);

	//call confirm occupancy api
	const request = {
        occupancyId: output.occupancyId,
        referenceType: "WAKESURF_BOOKING",
        referenceId: output.bookingId
    }
    try{
        await axios.put(`${process.env.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, request, {headers:{'Authorization': `token ${helper.getAccessToken()}`}});
    }catch(error){
		await session.abortTransaction();
        throw new InternalServerError(error, "Occupancy API not available");
    }

	const messageStr = JSON.stringify(output);
	try{
		await lipslideCommon.publishToKafkaTopic(process.env.KAFKA_CLIENT_ID, process.env.KAFKA_BROKERS.split(" "), process.env.NEW_BOOKING_TOPIC, [{"value": messageStr}]);
	}catch(error){
		await session.abortTransaction();
		throw new InternalServerError(error, `Event Source not available`);
	}

	await session.commitTransaction();
	await session.endSession();

	return output;
}

async function confirmBooking(input){
	helper.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);
	
	wakesurfBooking.status = CONFIRMED_BOOKING_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		throw new DBError(error);
	}

	logger.info(`Confirmed Booking(${wakesurfBooking._id})`);

	return helper.modelToOutput(wakesurfBooking);
}

async function fulfillBooking(input) {
	helper.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);

	if (wakesurfBooking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (wakesurfBooking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	wakesurfBooking.status = FULFILLED_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		throw new DBError(error);
	}

	logger.info(`Fulfilled Booking(${wakesurfBooking._id})`);

	return helper.modelToOutput(wakesurfBooking);
}

async function cancelBooking(input) {
	helper.validateInput(Joi.object({
		bookingId: Joi.string().min(1).required()
	}), input);

	let wakesurfBooking = await helper.getWakesurfBooking(input.bookingId);
	
	if (wakesurfBooking.status === CANCELLED_STATUS)
	throw new BadRequestError("Booking already cancelled");

	if (wakesurfBooking.status === FULFILLED_STATUS)
	throw new BadRequestError("Cannot cancel an already fulfilled booking");

	wakesurfBooking.status = CANCELLED_STATUS;
	wakesurfBooking.lastUpdateTime = new Date();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		throw new DBError(error);
	}

	logger.info(`Cancelled Booking(${wakesurfBooking._id})`);

	return helper.modelToOutput(wakesurfBooking);
}

async function findBooking(input) {
	helper.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

	let wakesurfBooking;
	
	try{
		wakesurfBooking = await wakesurfBooking.findById(input.bookingId);
	}catch(error){
		throw new DBError(error);
	}
	
	if(!wakesurfBooking)
	throw new ResourceNotFoundError("WakesurfBooking", input);
	
	return helper.modelToOutput(wakesurfBooking);
}

async function searchBookings(input){
	try{
		return await WakesurfBooking.find();
	}catch(error){
		throw new DBError(error)
	}
}

async function deleteAllBookings(input){
	helper.validateInput(Joi.object({
		passcode: Joi.string().required()
	}), input);

	if(process.env.NODE_ENV != "development")
	throw new UnauthorizedError("Cannot perform this function in this environment");

	if(input.passcode != process.env.GOD_PASSCODE)
	throw new UnauthorizedError("You are not GOD");

	await WakesurfBooking.deleteMany();

	return {status: "SUCCESS"}
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	findBooking,
	searchBookings,
	deleteAllBookings
}