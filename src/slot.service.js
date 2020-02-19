"use strict";
const fetch = require("node-fetch");
const logger = require("./logger");
const helper = require("./helper");
const bookingService = require("./booking.service");

const OCCUPANCY_DOMAIN = "http://OccupancyApi-env.pkny93vkkt.us-west-2.elasticbeanstalk.com";
const OCCUPANCIES_SERVICE = "/occupancies";
const UNIT_PRICE = 1400;
const DAY_START = 5;
const DAY_END = 14;

/**********************************************************
By : Ken Lai

Returns hourly slots of target date.
Will include unitPrice and availability in each slot
**********************************************************/
function getSlots(input){
	return new Promise(async (resolve, reject) => {

		//validate target date
		if(input.targetDate == null){
			reject({
				status : 400,
				message : "targetDate is mandatory"
			});
		}

		const year = input.targetDate.substring(0,4);
		const month = input.targetDate.substring(5,7);
		const date = input.targetDate.substring(8,10);

		const targetDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));;

		resolve(targetDate);
	})
	.then(targetDate => {
		/********************************************
		generate slots from 5am to 7pm
		********************************************/
		const slots = generateSlots(targetDate, DAY_START, DAY_END);
		return slots;
	})
	.then(async slots => {
		/**********************************************
		set availbility for all slots
		**********************************************/
		slots = await setAvailbilities(slots);
		return slots;
	})
	.then(slots => {
		/***************************************************************************
		Set the unit price of each slot
		will fetch from external pricing API
		****************************************************************************/
		for (var i = 0; i < slots.length; i++) {
			//TODO - change this to fetch from external pricing API
			slots[i].unitPrice = UNIT_PRICE;
		}

		return slots;
	})
	.then(slots => {
		/***************************************************
		change startTime and endTime into standard string
		***************************************************/
		for (var i = 0; i < slots.length; i++) {
			slots[i].startTime = helper.dateToStandardString(slots[i].startTime);
			slots[i].endTime = helper.dateToStandardString(slots[i].endTime);
		}

		return slots;
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running slot.service.getSlots() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
}

/*********************************************************************
By : Ken Lai

Returns all immediate available end slots after the target start slot
**********************************************************************/
function getAvailableEndSlots(input){
	return new Promise(async (resolve, reject) => {
		
		//validate target date
		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}

		//init and set criteria.startTime and criteria,targetDate
		var criteria = new Object();

		criteria.startTime = helper.standardStringToDate(input.startTime);
		
		const year = input.startTime.substring(0,4);
		const month = input.startTime.substring(5,7);
		const date = input.startTime.substring(8,10);
		criteria.targetDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));;

		resolve(criteria);
	})
	.then(criteria => {
		/********************************************
		generate slots from 5am to 7pm
		********************************************/
		criteria.slots = generateSlots(criteria.targetDate, DAY_START, DAY_END);
		return criteria;
	})
	.then(async criteria => {
		/**********************************************
		set availbility for all slots
		**********************************************/
		criteria.slots = await setAvailbilities(criteria.slots);
		return criteria;
	})
	.then(criteria => {
		/*******************************************************
		Get all the available end slots after a start slot
		*******************************************************/
		const slots = criteria.slots;
		const startSlot = getSlotByStartTime(criteria.startTime, slots);
		
		var availableEndSlots = new Array();
		
		for (var i = startSlot.index; i < slots.length; i++) {
			if(slots[i].available == true){
				availableEndSlots.push(slots[i]);
			}else{
				break;
			}
		}

		return availableEndSlots;

	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running slot.service.getSlots() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
}

/****************************************************************
By : Ken Lai

private function - set availbility of each slot by calling
external occupancy api
*****************************************************************/
function setAvailbilities(slots){
	return new Promise(async (resolve, reject) => {
	
		/***************************************************************
		call external occupancy API to save occupancy record
		***************************************************************/
		const targetDate = new Date(slots[0].startTime);
		const dayBegin = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
		const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59));
		
		const url = OCCUPANCY_DOMAIN + OCCUPANCIES_SERVICE;
		const headers = {
			"content-Type": "application/json",
		}
		const data = {
			"startTime": helper.dateToStandardString(dayBegin),
			"endTime": helper.dateToStandardString(dayEnd)
		}

		var occupancies = new Array();
		await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data)})
		.then((res) => {
			/**********************************************************************
			throw 500 error, external occupancyService/occupancies service not available
			***********************************************************************/
			if (res.status >= 200 && res.status < 300) {
				return res.json();
			}else{
				logger.error(res.statusText);
				throw {
					status : 500,
					message : "Booking Service not available"
				}
			}
		})
		.then((result) => {
			occupancies = result;
		})

		resolve(occupancies);
	})
	.then(occupancies => {
		
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
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running slot.service.getSlots() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
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
