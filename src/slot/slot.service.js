"use strict";
const moment = require("moment");
const Joi = require("joi");

const customError = require("../common/customError");
const logger = require("../common/logger").logger;
const userAuthorization = require("../common/middleware/userAuthorization");
const pricingHelper = require("../slot/pricing_internal.helper");
const slotHelper = require("./slot.helper");
const occupancyHelper = require("./occupancy_internal.helper");
const slotMapper = require("./slotMapper.helper");

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
	//validate user group rights
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
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
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	var targetDateStr = input.targetDate.slice(0, 10);
	var dayStartTime = moment(targetDateStr + "T" + DAY_START + "Z").toDate();
	var dayEndTime = moment(targetDateStr + "T" + DAY_END + "Z").toDate();

	//generate slots from day start to day end
	var slots = slotHelper.generateSlots(dayStartTime, dayEndTime);

	//get all existing occupancies between dayStarTime and dayEndTime
	let occupancies;
	try {
		occupancies = occupancyHelper.getOccupancies(slots[0].startTime, slots[slots.length - 1].endTime, DEFAULT_ASSET_ID);
	} catch (err) {
		logger.error("getOccupanciesHelper.getOccupancies error : ", err);
		throw { "name": customError.INTERNAL_SERVER_ERROR, "message": "Internal Server Error" };
	}

	//set availibilities for each slots
	slotHelper.setSlotsAvailabilities(slots, occupancies);
	
	//if customer booking
	//for each slots, chceck the availability of the nexst slot, 
	//if not available, set itself to not available as well due to minimum 2hrs limit
	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		slots.forEach((slot, index) => {
			const nextIndex = index + 1;

			if (index < slots.length - 1) {
				if (slots[nextIndex].available == false) {
					slot.available = false
				}
			}
		});
	}

	let outputObjs = [];
	slots.forEach(slot => {
		let outputObj = slotMapper(slot);
		outputObjs.push(outputObj);
	})

	return { "slots": outputObjs };
}

/*********************************************************************
By : Ken Lai

Returns all immediate available end slots after the target start slot
**********************************************************************/
async function getEndSlots(input, user) {
	//validate user group rights
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//setup dayStartTime & datyEndTimefor generateSlots() function
	const targetDateStr = input.startTime.slice(0, 10);
	const dayStartTime = moment(targetDateStr + "T" + DAY_START + "Z").toDate();
	const dayEndTime = moment(targetDateStr + "T" + DAY_END + "Z").toDate();

	//validate startTime cannot be before dayStartTime
	const startTime = moment(input.startTime).toDate();
	if (startTime < dayStartTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be earlier then " + DAY_START };
	}

	//validate startTime cannot be after dayEndTime
	if (startTime > dayEndTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then " + DAY_END };
	}

	//generate slots from day start to day end
	const slots = slotHelper.generateSlots(dayStartTime, dayEndTime);

	let occupancies;
	try {
		occupancies = await occupancyHelper.getOccupancies(slots[0].startTime, slots[slots.length - 1].endTime, DEFAULT_ASSET_ID);
	} catch (err) {
		logger.error("getOccupanciesHelper.getOccupancies error : ", err);
		throw { "name": customError.INTERNAL_SERVER_ERROR, "message": "Internal Server Error" };
	}

	//set availibility for each slot
	slotHelper.setSlotsAvailabilities(slots, occupancies);

	//Get all the available end slots after a start slot
	const startSlot = slotHelper.getSlotByStartTime(startTime, slots);

	//filter out only end slots
	let endSlots = new Array();
	for (var i = startSlot.index; i < slots.length; i++) {
		if (slots[i].available == true) {
			endSlots.push(slots[i]);
		} else {
			break;
		}
	}

	//set totalAmount for each end slot
	endSlots.forEach((slot => {
		const totalAmountObj = pricingHelper.calculateTotalAmount(startTime, slot.endTime);
		slot.totalAmount = totalAmountObj.totalAmount;
		slot.currency = totalAmountObj.currency;
		slot.startTime = moment(slot.startTime).toISOString();
		slot.endTime = moment(slot.endTime).toISOString();
	}));

	return { "endSlots": endSlots };
}

module.exports = {
	getSlots,
	getEndSlots
}
