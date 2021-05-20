"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const bookingDomain = require("./booking.domain");

async function validateBookingId(bookingId){
    return await bookingDomain.readBooking(bookingId);
}

async function bookingHistoryToOutputObj(bookingHistory){
    let outputObj = new Object();

    outputObj.bookingId =  bookingHistory.bookingId;

    outputObj.history = [];
    bookingHistory.history.forEach(item => {
        outputObj.history.push({
            event: item.event,
            eventTime: item.eventTime,
            requestorId: item.requestorId
        });
    });

    return outputObj;
}

module.exports = {
	validateBookingId,
    bookingHistoryToOutputObj
}