"use strict";
const logger = require("./logger");
const helper = require("./helper");
const bookingService = require("./booking.service");

const DAY_START_HOUR = 5;
const DAY_END_HOUR = 14;
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

	var targetDate;
	try {
		targetDate = helper.standardStringToDate(input.targetDate + "T00:00:00");
	} catch (err) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}
	
	//generate slots from 5am to 7pm
	var slots = generateSlots(targetDate, DAY_START_HOUR, DAY_END_HOUR);

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
async function getAvailableEndSlots(input, user){
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
	
	//TODO validate startTime cannot be before DAY_START or after DAY_END
	
	//generate slots from 5am to 7pm
	var slots = generateSlots(startTime, DAY_START_HOUR, DAY_END_HOUR);
	
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
	
	var availableEndSlots = new Array();	
	for (var i = startSlot.index; i < slots.length; i++) {
		if(slots[i].available == true){
			availableEndSlots.push(slots[i]);
		}else{
			break;
		}
	}

	return availableEndSlots;

}

/****************************************************************
By : Ken Lai

private function - set availbility of each slot by calling
external occupancy api
*****************************************************************/
async function setAvailbilities(slots){

	const targetDate = helper.standardStringToDate(slots[0].startTime);
	const dayBegin = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
	dayBegin.setHours(dayBegin.getHours() + 8);
	const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
	dayEnd.setHours(dayEnd.getHours() + 8);

	//call external occupancy API to get all occupancies between startTime and endTime
	const startTimeStr = helper.dateToStandardString(dayBegin);
	const endTimeStr = helper.dateToStandardString(dayEnd);
	
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
		var slotStartTime = helper.standardStringToDate(slots[i].startTime);
		var slotEndTime = helper.standardStringToDate(slots[i].endTime);

		for(var j = 0; j < occupancies.length; j++){

			const occupancyStartTime = helper.standardStringToDate(occupancies[j].startTime);
			const occupancyEndTime = helper.standardStringToDate(occupancies[j].endTime);

			if((slotStartTime >= occupancyStartTime && slotStartTime <= occupancyEndTime) ||
				(slotEndTime >= occupancyStartTime && slotEndTime <= occupancyEndTime) ||
				(slotStartTime <= occupancyStartTime && slotEndTime >= occupancyEndTime)){
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
function generateSlots(targetDate, dayStart, dayEnd) {
	
	var hour = dayStart;
	var slots = new Array();

	for (var i=0; i<dayEnd; i++){

		var slot = new Object();
		slot.index = i;
		hour = hour + 1;
		
		const startTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0, 0));
		slot.startTime = helper.dateToStandardString(startTime);
		
		const endTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 59, 59));
		slot.endTime = helper.dateToStandardString(endTime);

		slot.available = true;

		slots.push(slot); 
	}

	return slots;
}

/****************************************************************
By : Ken Lai

private function - return a specific slot by its startTime
****************************************************************/
function getSlotByStartTime(startTime, slots) {
	
	for (var i = 0; i < slots.length; i++) {

		var slotStartTime = helper.standardStringToDate(slots[i].startTime);
		
		if (startTime >= slotStartTime && startTime <= slotStartTime){
			return slots[i];
		}
	}
}

module.exports = {
	getSlots,
	getAvailableEndSlots
}
