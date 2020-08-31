"use strict";
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const Booking = require("./booking.model").Booking;
const getCrewHelper = require("./getCrew_internal.helper");

async function addCrew(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			bookingCommon.BOOKING_ADMIN_GROUP
		]

		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			bookingId: Joi
				.string()
				.required(),
			crewId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//validate bookingId
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" });
		}

		//find booking
		Booking.findById(input.bookingId)
			.then(booking => {
				//if no booking found, it's a bad bookingId,
				if (booking == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
				}

				return getCrewHelper.getCrew(input.crewId);
			})
			.then(crew => {
				if (crew == null || crew.id == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" });
				}

				//add crew
				if (booking.crews == null) {
					booking.crews = new Array();
				}

				booking.crews.push({
					crewId: crew.id,
					crewName: crew.crewName,
					telephoneCountryCode: crew.telephoneCountryCode,
					telephoneNumber: crew.telephoneNumber,
					assignmentTime: gogowakeCommon.getNowUTCTimeStamp(),
					assignmentBy: user.id
				});

				//add transaction history
				booking.history.push({
					transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
					transactionDescription: "Added new crew : " + input.crewId,
					userId: user.id,
					userName: user.name
				});

				return booking.save();
			})
			.then(booking => {
				resolve(booking);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});

}

module.exports = {
	addCrew
}