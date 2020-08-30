"use strict";
const winston = require("winston");
const moment = require("moment");
const Joi = require("joi");
const config = require("config");

const calculateTotalAmountHelper = require("../slot/calculateTotalAmount_internal.helper");
const generateSlots = require("./generateSlots.helper");
const getOccupanciesHelper = require("./getOccupancies_internal.helper");
const setSlotsAvailibilities = require("./setSlotsAvailibilities.helper");
const getSlotByStartTimeHelper = require("./getSlotByStartTime.helper");
const slotMapper = require("./slotMapper.helper");
const common = require("gogowake-common");
const customError = require("../errors/customError");

const OWNER_BOOKING_TYPE = "OWNER_BOOKING";
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING"

const DAY_START = "05:00:00";
const DAY_END = "19:59:59";
const DEFAULT_ASSET_ID = "MC_NXT20";

/**********************************************************
By : Ken Lai
Date : Mar 13 2020

Returns hourly slots of target date.
Will include unitPrice and availability in each slot
**********************************************************/
function getSlots(input, user) {
	return new Promise((resolve, reject) => {
		//validate user group rights
		const rightsGroup = [
			"BOOKING_ADMIN_GROUP",
			"BOOKING_USER_GROUP"
		]

		if (common.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}
		
		//validate input data
		const schema = Joi.object({
			targetDate: Joi.date().iso().required(),
			bookingType: Joi
				.string()
				.required()
				.valid(OWNER_BOOKING_TYPE, CUSTOMER_BOOKING_TYPE)
		});
		
		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}
		
		var targetDateStr = input.targetDate.slice(0, 10);
		var dayStartTime = moment(targetDateStr + "T" + DAY_START + "Z").toDate();
		var dayEndTime = moment(targetDateStr + "T" + DAY_END + "Z").toDate();
		
		//generate slots from day start to day end
		var slots = generateSlots(dayStartTime, dayEndTime);

		//get all existing occupancies between dayStarTime and dayEndTime
		getOccupanciesHelper.getOccupancies(slots[0].startTime, slots[slots.length - 1].endTime, DEFAULT_ASSET_ID)
			.then(result => {
				return result.occupancies;
			})
			.then(occupancies => {
				return setSlotsAvailibilities(slots, occupancies);
			})
			.then(slotsWithAvailibilities => {
				//if customer booking
				//for each slots, chceck the availability of the nexst slot, 
				//if not available, set itself to not available as well due to minimum 2hrs limit
				if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
					slotsWithAvailibilities.forEach((slot, index) => {
						const nextIndex = index + 1;

						if (index < slots.length - 1) {
							if (slots[nextIndex].available == false) {
								slot.available = false
							}
						}

					});
				}

				var outputObjs = [];
				slots.forEach(slot => {
					var outputObj = slotMapper(slot);
					outputObjs.push(outputObj);
				})
				
				resolve({ "slots": outputObjs });
			})
			.catch(err => {
				switch (err.name) {
					case customError.JWT_ERROR:
						winston.error("Error while verifying accessToken, running jwt.verify()", err);
						break;
					default:
						winston.error("Internal Server Error", err);
				}
				
				reject(err);
			});
	});
}

/*********************************************************************
By : Ken Lai

Returns all immediate available end slots after the target start slot
**********************************************************************/
function getEndSlots(input, user) {
	return new Promise((resolve, reject) => {
		//validate user group rights
		const rightsGroup = [
			"BOOKING_ADMIN_GROUP",
			"BOOKING_USER_GROUP"
		]

		if (common.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			startTime: Joi.date().iso().required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//setup dayStartTime & datyEndTimefor generateSlots() function
		var targetDateStr = input.startTime.slice(0, 10);
		var dayStartTime = moment(targetDateStr + "T" + DAY_START + "Z").toDate();
		var dayEndTime = moment(targetDateStr + "T" + DAY_END + "Z").toDate();

		//validate startTime cannot be before dayStartTime
		var startTime = moment(input.startTime).toDate();
		if (startTime < dayStartTime) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be earlier then " + DAY_START});
		}

		//validate startTime cannot be after dayEndTime
		if (startTime > dayEndTime) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then " + DAY_END});
		}

		//generate slots from day start to day end
		var slots = generateSlots(dayStartTime, dayEndTime);

		getOccupanciesHelper.getOccupancies(slots[0].startTime, slots[slots.length - 1].endTime, DEFAULT_ASSET_ID)
			.then(occupancies => {
				//set availibility for each slot
				return setSlotsAvailibilities(slots, occupancies);
			})
			.then(slotsWithAvailibilities => {
				//Get all the available end slots after a start slot
				const startSlot = getSlotByStartTimeHelper.getSlotByStartTime(startTime, slotsWithAvailibilities);

				//filter out only end slots
				var endSlots = new Array();
				for (var i = startSlot.index; i < slots.length; i++) {
					if (slots[i].available == true) {
						endSlots.push(slots[i]);
					} else {
						break;
					}
				}

				return endSlots;
			})
			.then(endSlots => {
				//set totalAmount for each end slot
				endSlots.forEach((slot => {
					const totalAmountObj = calculateTotalAmountHelper.calculateTotalAmount(startTime, slot.endTime);
					slot.totalAmount = totalAmountObj.totalAmount;
					slot.currency = totalAmountObj.currency;
					slot.startTime = moment(slot.startTime).toISOString();
					slot.endTime = moment(slot.endTime).toISOString();
				}));

				resolve({ "endSlots": endSlots });
			})
			.catch(err => {
				winston.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

module.exports = {
	getSlots,
	getEndSlots
}
