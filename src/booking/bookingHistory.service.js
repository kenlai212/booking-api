"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const bookingHistoryDomain = require("./bookingHistory.domain");
const bookingHistoryHelper = require("./bookingHistory.helper");

async function newBookingHistory(input){
    const schema = Joi.object({
		bookingId: Joi.string().required(),
        requestorId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    await bookingHistoryHelper.validateBookingId(input.bookingId);

    //check if bookingHistory already exists
    let existingBookingHistory
    try{
        existingBookingHistory = await bookingHistoryDomain.readBookingHistory(input.bookingId);
    }catch(error){
        if(error != customError.RESOURCE_NOT_FOUND_ERROR)
        throw error;
    }

    if(existingBookingHistory)
    throw { name: customError.BAD_REQUEST_ERROR, message: `BookingHistory(bookingId:${input.bookingId}) already exist` };

    //init bookingHistory record
    const createBookingHistoryInput = {
        bookingId: input.bookingId
    }
    let bookingHistory = await bookingHistoryDomain.createBookingHistory(createBookingHistoryInput);
    
    //save "New Booking" histroy event
    const newBookingEvent = {
        requestorId: input.requestorId,
        event: "New Booking",
        eventTime: new Date()
    }

    if(!bookingHistory.history)
    bookingHistory.history = [];

    bookingHistory.history.push(newBookingEvent);

    bookingHistory = await bookingHistoryDomain.updateBookingHistory(bookingHistory);

    logger.info(`Add new BookingHistory(bookingId:${bookingHistory.bookingId})`);

    return bookingHistoryHelper.bookingHistoryToOutputObj(bookingHistory); 
}

async function findBookingHistory(input){
    const schema = Joi.object({
		bookingId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    const bookingHistory = await bookingHistoryDomain.readBookingHistory(input.bookingId);

    return bookingHistoryHelper.bookingHistoryToOutputObj(bookingHistory);
}

async function deleteAllBookingHistories(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await bookingHistoryDomain.deleteAllBookingHistories();

	return {status: "SUCCESS"}
}

module.exports = {
	newBookingHistory,
    findBookingHistory,
    deleteAllBookingHistories
}