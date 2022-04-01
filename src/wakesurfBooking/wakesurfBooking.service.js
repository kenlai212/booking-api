"use strict";
const config = require('config');
const Joi = require("joi");
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {logger, DBError, ResourceNotFoundError, UnauthorizedError, InternalServerError, BadRequestError} = lipslideCommon;
const utility = require("../utility");
const {WakesurfBooking} = require("./wakesurfBooking.model");
const helper = require("./wakesurfBooking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

async function newBooking(input) {
	helper.validateInput(Joi.object({
		occupancyId: Joi.string().required(),
		host:Joi.object({
			personId: Joi.string(),
			name: Joi.string(),
			countryCode: Joi.string(),
			phoneNumber: Joi.string()
		})
		.xor("personId", "name")
		.with("name",["phoneNumber", "countryCode"]).required(),
		captain: Joi.object({
			staffId: Joi.string().required()
		})
	}), input);

	await helper.validateOccupancyId(input.occupancyId);

	//helper.validateBookingTime(occupancy.startTime, occupancy.endTime, input.hostPersonId);

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();
	
	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	let wakesurfBooking = new WakesurfBooking();
	wakesurfBooking._id = uuidv4();
	wakesurfBooking.creationTime = new Date();
	wakesurfBooking.lastUpdateTime = new Date();
	wakesurfBooking.occupancyId = input.occupancyId;
	wakesurfBooking.status = AWAITING_CONFIRMATION_STATUS;
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
	if(input.captain){
		wakesurfBooking.captain = {
			staffId: input.captain.staffId
		}
	}
	
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
        await axios.put(`${config.get("api.occupancyApi")}/occupancy/confirm`, request, {headers:{'Authorization': `token ${helper.getAccessToken()}`}});
    }catch(error){
		await session.abortTransaction();
        throw new InternalServerError(error, "Occupancy API not available");
    }

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
	helper.validateInput(Joi.object({
		bookingId: Joi.string().required()
	}), input);

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

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
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

	if(mongoose.connection.readyState != 1)
    utility.initMongoDb();

	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
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

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	findBooking,
	searchBookings
}