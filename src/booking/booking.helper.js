"use strict";
const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking} = require("./booking.model");

function validateAssetId(assetId){
    if(assetId != "MC_NXT20")
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

async function findBooking(bookingId){
    let booking;
	try {
		booking = await Booking.findById(bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Booking Error" };
	}

	if (!booking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

    return booking;
}

async function saveBooking(booking){
    try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Booking Error" };
	}

    return booking;
}

module.exports = {
    validateAssetId,
    findBooking,
    saveBooking
}