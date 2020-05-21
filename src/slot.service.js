"use strict";
const logger = require("./logger");
const helper = require("./helper");
const pricingService = require("./pricing.service");

const DAY_START = "05:00:00";
const DAY_END = "19:59:59";
const DEFAULT_ASSET_ID = "MC_NXT20";

/**********************************************************
By : Ken Lai
Date : Mar 13 2020

Returns hourly slots of target date.
Will include unitPrice and availability in each slot
**********************************************************/
async function getSlots(input, user){
	var response = new Object;

	//validate user group rights
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	if (helper.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate target date
	if (input.targetDate == null || input.targetDate.length < 1) {
		response.status = 400;
		response.message = "targetDate is mandatory";
		throw response;
	}

	var dayStartTime;
	try {
		dayStartTime = helper.standardStringToDate(input.targetDate + "T" + DAY_START);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}

	var dayEndTime;
	try {
		dayEndTime = helper.standardStringToDate(input.targetDate + "T" + DAY_END);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}
	
	//generate slots from day start to day end
	var slots = generateSlots(dayStartTime, dayEndTime);

	//set availbility for all slots
	await setAvailbilities(slots)
		.then(slotsWithAvailability => {
			slots = slotsWithAvailability;
		})
		.catch(err => {
			logger.error("setAvailbilities() error : " + err);
			response.status = err.status;
			response.message = err.message;
			throw response;
		});
	
	return slots;

}

/*********************************************************************
By : Ken Lai

Returns all immediate available end slots after the target start slot
**********************************************************************/
async function getEndSlots(input, user){
	var response = new Object;

	//validate user group rights
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	if (helper.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}
	//validate start time
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	var startTime;
	try {
		startTime = helper.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;
	}

	//setup daytStartTime for generateSlots() function
	var dayStartTime;
	var targetDateStr = input.startTime.slice(0,10);
	try {
		dayStartTime = helper.standardStringToDate(targetDateStr + "T" + DAY_START);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid dayStartTime format";
		throw response;
	}

	//setup dayEndTime  for generateSlots() function
	var dayEndTime;
	try {
		dayEndTime = helper.standardStringToDate(targetDateStr + "T" + DAY_END);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid dayEndTime format";
		throw response;
	}

	//validate startTime cannot be before dayStartTime
	if (startTime < dayStartTime) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}

	//validate startTime cannot be after dayEndTime
	if (startTime > dayEndTime) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}

	//generate slots from day start to day end
	var slots = generateSlots(dayStartTime, dayEndTime);
	
	//set availbility for all slots
	await setAvailbilities(slots)
	.then(slotsWithAvailability => {
		slots = slotsWithAvailability;
	})
	.catch(err => {
		logger.error("setAvailbilities() error : " + err);
		response.status = 500;
		response.message = "setAvailbilities function not available";
		throw response;
	});

	//Get all the available end slots after a start slot
	const startSlot = getSlotByStartTime(startTime, slots);

	var endSlots = new Array();	
	for (var i = startSlot.index; i < slots.length; i++) {
		if(slots[i].available == true){
			endSlots.push(slots[i]);
		}else{
			break;
		}
	}
	
	//set totalAmount for each end slot
	endSlots.forEach((slot => {
		try {
			const totalAmountObj = pricingService.calculateTotalAmount({ "startTime": helper.dateToStandardString(startTime), "endTime": helper.dateToStandardString(slot.endTime) }, user);
			slot.totalAmount = totalAmountObj.totalAmount;
			slot.currency = totalAmountObj.currency;
		} catch (err) {
			logger.error("pricingService.calculateTotalAmount() error : " + err);
			throw err;
		}
	}));

	return endSlots;

}

/****************************************************************
By : Ken Lai

private function - set availbility of each slot by calling
external occupancy api
*****************************************************************/
async function setAvailbilities(slots){

	//call external occupancy API to get all occupancies between startTime and endTime
	const startTimeStr = helper.dateToStandardString(slots[0].startTime);
	const endTimeStr = helper.dateToStandardString(slots[slots.length - 1].endTime);
	
	const url = process.env.OCCUPANCY_DOMAIN + process.env.OCCUPANCIES_SUBDOMAIN + "?startTime=" + startTimeStr + "&endTime=" + endTimeStr + "&assetId=" + DEFAULT_ASSET_ID;
	const requestAttr = {
		method: "GET"
	}

	var occupancies
	await helper.callAPI(url, requestAttr)
		.then(result => {
			occupancies = result;
		})
		.catch(err => {
			throw err;
		});
	
	for (var i = 0; i < slots.length; i++) {
		slots[i].available = true;

		var slotStartTime = slots[i].startTime;
		var slotEndTime = slots[i].endTime;

		for(var j = 0; j < occupancies.length; j++){

			const occupancyStartTime = helper.standardStringToDate(occupancies[j].startTime);
			const occupancyEndTime = helper.standardStringToDate(occupancies[j].endTime);

			if ((slotStartTime >= occupancyStartTime && slotStartTime <= occupancyEndTime) ||
				(slotEndTime >= occupancyStartTime && slotEndTime <= occupancyEndTime) ||
				(slotStartTime <= occupancyStartTime && slotEndTime >= occupancyEndTime)) {
				slots[i].available = false;
			}
		}	
	}

	return slots;
}

/****************************************************************
By : Ken Lai

private function - generate all slots of target day
****************************************************************/
function generateSlots(dayStartTime, dayEndTime) {

	var slots = new Array();

	var slotStartTime = dayStartTime;
	var slotEndTime = dayStartTime;
	var index = 0;
	while (slotEndTime < dayEndTime) {

		var slot = new Object();
		slot.index = index;
		
		slot.startTime = slotStartTime;

		slotEndTime = new Date(slotStartTime);
		//slotEndTime.setHours(slotEndTime.getHours() + 1);
		slotEndTime.setMinutes(59);
		slotEndTime.setSeconds(59);
		slot.endTime = slotEndTime;
		
		slots.push(slot);

		index++;
		slotStartTime = new Date(slotEndTime);
		slotStartTime.setSeconds(slotStartTime.getSeconds() + 1);
	}
	
	return slots;
}

/****************************************************************
By : Ken Lai

private function - return a specific slot by its startTime
****************************************************************/
function getSlotByStartTime(startTime, slots) {
	for (var i = 0; i < slots.length; i++) {
		
		if (startTime >= slots[i].startTime && startTime <= slots[i].endTime){
			return slots[i];
		}
	}
}

module.exports = {
	getSlots,
	getEndSlots
}
