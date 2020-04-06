"use strict";
const fetch = require("node-fetch");
const logger = require("./logger");
const helper = require("./helper");
const bookingService = require("./booking.service");

const OCCUPANCY_DOMAIN = process.env.OCCUPANCY_DOMAIN;
const OCCUPANCIES_SUBDOMAIN = process.env.OCCUPANCIES_SUBDOMAIN;
const UNIT_PRICE = process.env.UNIT_PRICE;
const DAY_START = 5;
const DAY_END = 14;

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
	if(input.targetDate == null){
		response.status = 400;
		response.message = "targetDate is mandatory";
		throw response;
	}

	const year = input.targetDate.substring(0,4);
	const month = input.targetDate.substring(5,7);
	const date = input.targetDate.substring(8,10);
	const targetDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));;

	//generate slots from 5am to 7pm
	var slots = generateSlots(targetDate, DAY_START, DAY_END);

	//Set the unit price of each slot
	slots = setUnitPrices(slots);

	//set availbility for all slots
	await setAvailbilities(slots)
	.then(slotsWithAvailability => {
		slots = slotsWithAvailability;
	})
	.catch(err => {
		logger.error("setAvailbilities() error : " + err);
		response.status = 500;
		response.message = "setAvailbility function not available";
		throw response;
	});

	//change startTime and endTime into standard string
	slots = setResponseFormatting(slots);

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

	//validate target date
	if(input.startTime == null){
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	//init and startTime and targetDate
	const startTime = helper.standardStringToDate(input.startTime);
		
	const year = input.startTime.substring(0,4);
	const month = input.startTime.substring(5,7);
	const date = input.startTime.substring(8,10);
	const targetDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));
	
	//generate slots from 5am to 7pm
	var slots = generateSlots(targetDate, DAY_START, DAY_END);
	
	//set availbility for all slots
	await setAvailbilities(slots)
	.then(slotsWithAvailability => {
		slots = slotsWithAvailability;
	})
	.catch(err => {
		logger.error("setAvailbilities() error : " + err);
		response.status = 500;
		response.message = "setAvailbility function not available";
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

	//Set the unit price of each slot
	availableEndSlots = setUnitPrices(availableEndSlots);

	//change startTime and endTime into standard string
	availableEndSlots = setResponseFormatting(availableEndSlots);

	return availableEndSlots;

}

/****************************************************************
By : Ken Lai

private function - set the response JSON formatting of each slot
Chage startTime and endTime to standardDateStr format
*****************************************************************/
function setResponseFormatting(slots){
	for (var i = 0; i < slots.length; i++) {
		slots[i].startTime = helper.dateToStandardString(slots[i].startTime);
		slots[i].endTime = helper.dateToStandardString(slots[i].endTime);
	}

	return slots;
}

/****************************************************************
By : Ken Lai

private function - set unit of each slot
//TODO - will fetch from external pricing API
*****************************************************************/
function setUnitPrices(slots){
	for (var i = 0; i < slots.length; i++) {
		//TODO - change this to fetch from external pricing API
		slots[i].unitPrice = parseInt(UNIT_PRICE);
	}

	return slots;
}

/****************************************************************
By : Ken Lai

private function - set availbility of each slot by calling
external occupancy api
*****************************************************************/
async function setAvailbilities(slots){
	
	var response = new Object;

	const targetDate = new Date(slots[0].startTime);
	const dayBegin = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
	const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59));
	
	//call external occupancy API to save occupancy record
	var occupancies;
	await callOccupanciesAPI(dayBegin, dayEnd)
		.then(result => {
			occupancies = result;
		})
		.catch(err => {
			console.log(err);
			response.status = 500;
			response.message = err.message;
			throw response;
		});
	
	for (var i = 0; i < slots.length; i++) {
		var slotStartTime = slots[i].startTime;
		var slotEndTime = slots[i].endTime;

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

async function callOccupanciesAPI(startTime, endTime){

	const url = OCCUPANCY_DOMAIN + OCCUPANCIES_SUBDOMAIN;
	const headers = {
		"Authorization": "Token " + accessToken,
		"content-Type": "application/json"
	}
	const data = {
		"startTime": helper.dateToStandardString(startTime),
		"endTime": helper.dateToStandardString(endTime)
	}

	var occupancies = new Array();
	var tokenResponse = null;
	var breakFlag = false;
	for (var i = 0; i < 1; i++) {

		if (breakFlag == true) {
			break;
		}

		await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
			.then(async res => {
				if (res.status >= 200 && res.status < 300) {
					occupancies = res.json();
					breakFlag = true;
				} else if (res.status == 403) {
					
					await helper.callTokenAPI()
						.then(response => {
							tokenResponse = response;
						})
						.catch(err => {
							response.status = 500;
							response.message = "helper.callLoginAPI() not available";
							throw response;
						});

				} else {
					logger.error("External Occupancies API error : " + res.statusText);
					response.status = res.status;
					response.message = res.statusText;
					throw response;
				}
			});

		if (tokenResponse != null) {
			global.accessToken = tokenResponse.accessToken;
			logger.info("Obtained accessToken : " + global.accessToken);
		}
	}

	return occupancies;
}

/****************************************************************
By : Ken Lai

private function - generate all slots of target day
****************************************************************/
function generateSlots(targetDate, dayStart, dayEnd){

	var hour = dayStart;
	var slots = new Array();

	for (var i=0; i<dayEnd; i++){

		var slot = new Object();
		slot.index = i;
		hour = hour + 1;

		slot.startTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0 ,0));
		slot.endTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 59, 59));
		slot.available = true;
		slots.push(slot); 
	}

	return slots;
}

/****************************************************************
By : Ken Lai

private function - return a specific slot by its startTime
****************************************************************/
function getSlotByStartTime(startTime, slots){
	for (var i = 0; i < slots.length; i++) {
		if((startTime >= slots[i].startTime && startTime <= slots[i].startTime)){
			return slots[i];
		}
	}
}

module.exports = {
	getSlots,
	getAvailableEndSlots
}
