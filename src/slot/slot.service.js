"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {customError} = utility;

const slotHelper = require("./slot.helper");
const occupancyDomain = require("./Occupancy.domain");

const OWNER_BOOKING_TYPE = "OWNER_BOOKING";
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING"

const DAY_START = "05:00:00";
const DAY_END = "19:59:59";

async function getSlots(input) {
	const schema = Joi.object({
		targetDate: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi.string().required(),
		assetId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	slotHelper.validateAssetId(input.assetId);

	slotHelper.validateBookingType(input.bookingType);

	const dayStartIsoStr = input.targetDate + "T" + DAY_START;
	const dayEndIsoStr = input.targetDate + "T" + DAY_END;
	const dayStartTime = utility.isoStrToDate(dayStartIsoStr, input.utcOffset);
	const dayEndTime = utility.isoStrToDate(dayEndIsoStr, input.utcOffset);

	//generate slots from day start to day end
	var slots = slotHelper.generateSlots(dayStartTime, dayEndTime);
	
	//get all existing occupancies between dayStarTime and dayEndTime
	let occupancies = await occupancyDomain.readOccupancies(dayStartTime, dayEndTime);

	//if customer booking, set 2hrs prior slots restriction
	if (input.bookingType === CUSTOMER_BOOKING_TYPE)
		occupancies = slotHelper.setCustomerBookingStartSlotsRestriction(occupancies, 2);

	//add a buffer slot at the end of each occupacy
	occupancies = slotHelper.setBetweenBookingBufferSlot(occupancies)
	
	//set availibilities for each slots
	slots = slotHelper.setSlotsAvailabilities(slots, occupancies);

	return { slots: slots };
}

async function getEndSlots(input, user) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.required()
			.valid(OWNER_BOOKING_TYPE, CUSTOMER_BOOKING_TYPE),
		assetId: Joi
			.string()
			.required()
			.valid("MC_NXT20"),
		calculateTotalAmount: Joi.boolean()
	});
	utility.validateInput(schema, input);

	//setup dayStartTime & datyEndTimefor generateSlots() function
	const dayStartTimeStr = input.startTime.substr(0, 10) + "T" + DAY_START;
	const dayEndTimeStr = input.startTime.substr(0, 10) + "T" + DAY_END;
	const dayStartTime = utility.isoStrToDate(dayStartTimeStr, input.utcOffset);
	const dayEndTime = utility.isoStrToDate(dayEndTimeStr, input.utcOffset);
	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);

	//validate startTime cannot be before dayStartTime
	if (startTime < dayStartTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be earlier then " + DAY_START };

	//validate startTime cannot be after dayEndTime
	if (startTime > dayEndTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then " + DAY_END };

	//generate slots from day start to day end
	let slots = slotHelper.generateSlots(dayStartTime, dayEndTime);

	//get all existing occupancies between dayStarTime and dayEndTime
	let occupancies = occupancyDomain.readOccupancies(dayStartTime, dayEndTime);

	//set availibility for each slot
	slots = slotHelper.setSlotsAvailabilities(slots, occupancies);
	
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

	return { endSlots: endSlots };
}

module.exports = {
	getSlots,
	getEndSlots
}
