"use strict";
const fetch = require("node-fetch");
const logger = require("./logger");
const helper = require("./helper");
const bookingService = require("./booking.service");

const OCCUPANCY_DOMAIN = "http://OccupancyApi-env.pkny93vkkt.us-west-2.elasticbeanstalk.com";
const OCCUPANCIES_SERVICE = "/occupancies";
const UNIT_PRICE = 1400;

/**********************************************************
By : Ken Lai

returns hourly slots of target date
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

		//init and set criteria object
		var criteria = new Object();
		criteria.targetDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));;

		resolve(criteria);
	})
	.then(criteria => {
		/********************************************
		generate slots from 5am to 7pm
		********************************************/
		const targetDate = criteria.targetDate;
		var hour = 4;
		var slots = new Array();

		for (var i=0; i<14; i++){

			var slot = new Object();
			slot.index = i;
			hour = hour + 1;

			slot.startTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0 ,0));
			slot.endTime = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 59, 59));
			slot.available = true;

			slots.push(slot); 
		}

		criteria.slots = slots;

		return criteria;
	})
	.then(async criteria => {
		
		/*************************************************************************************
		Set the availbility of each slot.
		It will get all the occupancies of the targetDate,
		then compare each slot to define availability (boolean) flag.
		*************************************************************************************/

		const targetDate = new Date(criteria.slots[0].startTime);
		const dayBegin = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
		const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59));

		/***************************************************************
		call external occupancy API to save occupancy record
		***************************************************************/
		const url = OCCUPANCY_DOMAIN + OCCUPANCIES_SERVICE;
		const headers = {
			"content-Type": "application/json",
		}

		const data = {
			"startTime": helper.dateToStandardString(dayBegin),
			"endTime": helper.dateToStandardString(dayEnd)
		}

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
			criteria.occupancies = result;
		});
		
		return criteria;
	})
	.then(criteria => {
		/***************************************************************************
		Set the availbility of each slot.
		It will get all the occupancies of the targetDate,
		then compare each slot to define availability (boolean) flag.
		****************************************************************************/
		var slots = criteria.slots;
		const occupancies = criteria.occupancies;

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

module.exports = {
	getSlots
}
