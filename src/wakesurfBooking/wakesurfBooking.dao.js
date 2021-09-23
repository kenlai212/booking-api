"use strict";
const {v4: uuidv4} = require("uuid");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {WakesurfBooking} = require("./wakesurfBooking.model");

async function save(wakesurfBooking){
	if(!wakesurfBooking._id)
	wakesurfBooking._id = uuidv4();

    if(!wakesurfBooking.creationTime)
    wakesurfBooking.creationTime = new Date();

    wakesurfBooking.lastUpdateTime = new Date();

    try{
        wakesurfBooking = await wakesurfBooking.save();
    }catch(error){
        logger.error("wakesurfBookin.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save wakesurfBookin Error" };
    }

    return wakesurfBooking;
}

async function find(bookingId){
    let wakesurfBooking;
	try {
		wakesurfBooking = await WakesurfBooking.findById(bookingId);
	} catch (err) {
		logger.error("wakesurfBooking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find wakesurfBooking Error" };
	}

	if (!wakesurfBooking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

    return wakesurfBooking;
}

async function search(startTime, endTime){
    let wakesurfBookings;
	try {
		wakesurfBookings = await WakesurfBooking.find(
			{
				startTime: { $gte: startTime },
				endTime: { $lt: endTime }
			})
			.sort("startTime");
	} catch (err) {
		logger.error("wakesurfBooking.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

    return wakesurfBookings
}

async function del(bookingId){
    try{
        await WakesurfBooking.findByIdAndDelete(bookingId);
    }catch(error){
        logger.error("wakesurfBooking.findByIdAndDelete Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete wakesurfBooking Error" };
    }
}

async function deleteAll(){
    try {
		await WakesurfBooking.deleteMany();
	} catch (err) {
		logger.error("wakesurfBooking.deleteMany() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete wakesurfBookings Error" }
	}

	return {status: "SUCCESS"}
}

module.exports = {
    save,
    find,
    search,
    del,
    deleteAll
}