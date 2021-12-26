"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {WakesurfBooking} = require("./wakesurfBooking.model");

const helper = require("./wakesurfBooking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const NEW_WAKESURFBOOKING_QUEUE_NAME = "NEW_WAKESURFBOOKING";
const CANCEL_WAKESURFBOOKING_QUEUE_NAME = "CANCEL_WAKESURFBOOKING";
const FAILED_BOOKING_QUEUE_NAME = "FAILED_BOOKING";

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw new BadRequestError(lipslideCommon.translateJoiValidationError(result.error))
	}
}

async function newBooking(input) {
	personHelper.validateInput(Joi.object({
		occupancyId: Joi.string().required(),
		hostPersonId: Joi.string().required(),
		captainStaffId: Joi.string()
	}), input);

	helper.validateBookingTime(occupancy.startTime, occupancy.endTime, input.hostPersonId);

	if(mongoose.connection.readyState != 1)
    lipslideCommon.initMongoDb(process.env.BOOKING_DB_CONNECTION_URL);
	
	const session = await WakesurfBooking.startSession();
	session.startTransaction();

	let wakesurfBooking = new WakesurfBooking();
	wakesurfBooking.occupancyId = occupancy._id;
	wakesurfBooking.status = AWAITING_CONFIRMATION_STATUS;
	wakesurfBooking.hostPersonId = input.hostPersonId;
	if(input.captainStaffId)
	wakesurfBooking.captainStaffId = input.captainStaffId;
	
	//if failed save wakesurfBooking record, publish FAILED_BOOKING so occupancyApi can release the occupancy
	try{
		wakesurfBooking = await wakesurfBooking.save();
	}catch(error){
		throw new InternalServerError(error, 'DB Error');
	}
	
	const output = helper.modelToOutput(wakesurfBooking);

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
	const schema = Joi.object({
		bookingId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	wakesurfBooking.status = CONFIRMED_BOOKING_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	logger.info(`Confirmed Booking(${wakesurfBooking._id})`);

	return await helper.modelToOutput(wakesurfBooking);
}

async function fulfillBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	if (wakesurfBooking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (wakesurfBooking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	wakesurfBooking.status = FULFILLED_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	logger.info(`Fulfilled Booking(${wakesurfBooking._id})`);

	return await helper.modelToOutput(wakesurfBooking);
}

async function cancelBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = bookingDao.find(input.bookingId);
	
	if (wakesurfBooking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already cancelled" };

	if (wakesurfBooking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot cancel an already fulfilled booking" };

	const oldStatus = {...wakesurfBooking.status};

	wakesurfBooking.status = CANCELLED_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	//publish cancelBooking event
	await lipslideCommon.publishEvent({bookingId: wakesurfBooking._id}, CANCEL_WAKESURFBOOKING_QUEUE_NAME, async () => {
		logger.error("rolling back cancelBooking");
		
		wakesurfBooking.status = oldStatus;
		await wakesurfBookingDao.save(wakesurfBooking);
	});

	logger.info(`Cancelled Booking(${wakesurfBooking._id})`);

	return await helper.modelToOutput(wakesurfBooking);
}

async function findBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	return await helper.modelToOutput(wakesurfBooking);
}

async function deleteAllBookings(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await wakesurfBookingDao.deleteAll();

	return {status: "SUCCESS"}
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	findBooking,
	deleteAllBookings
}