"use strict";
const pricingService = require("../pricing/pricing.service");
const common = require("gogowake-common");
const logger = common.logger;

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

	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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
		dayStartTime = common.standardStringToDate(input.targetDate + "T" + DAY_START);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid targetDate format";
		throw response;
	}

	var dayEndTime;
	try {
		dayEndTime = common.standardStringToDate(input.targetDate + "T" + DAY_END);
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

	//for each slots, chceck the availability of the nexst slot, 
	//if not available, set itself to not available as well due to minimum 2hrs limit
	slots.forEach((slot, index) => {
		const nextIndex = index + 1;

		if (index < slots.length - 1) {
			if (slots[nextIndex].available == false) {
				slot.available = false
			}
		}
		
	});

	var outputObjs = [];
	slots.forEach(slot => {
		var outputObj = slotToOutuptObj(slot);
		outputObjs.push(outputObj);
	})
	
	return outputObjs;

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

	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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
		startTime = common.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;
	}

	//setup daytStartTime for generateSlots() function
	var dayStartTime;
	var targetDateStr = input.startTime.slice(0,10);
	try {
		dayStartTime = common.standardStringToDate(targetDateStr + "T" + DAY_START);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid dayStartTime format";
		throw response;
	}

	//setup dayEndTime  for generateSlots() function
	var dayEndTime;
	try {
		dayEndTime = common.standardStringToDate(targetDateStr + "T" + DAY_END);
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
			const totalAmountObj = pricingService.calculateTotalAmount({ "startTime": common.dateToStandardString(startTime), "endTime": common.dateToStandardString(slot.endTime) }, user);
			slot.totalAmount = totalAmountObj.totalAmount;
			slot.currency = totalAmountObj.currency;
			slot.startTime = common.dateToStandardString(slot.startTime);
			slot.endTime = common.dateToStandardString(slot.endTime);
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
	const startTimeStr = common.dateToStandardString(slots[0].startTime);
	const endTimeStr = common.dateToStandardString(slots[slots.length - 1].endTime);
	
	const url = process.env.OCCUPANCY_DOMAIN + process.env.OCCUPANCIES_SUBDOMAIN + "?startTime=" + startTimeStr + "&endTime=" + endTimeStr + "&assetId=" + DEFAULT_ASSET_ID;
	const requestAttr = {
		method: "GET",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		}
	}

	await common.callAPI(url, requestAttr)
		.then(result => {
			var occupancies = result;

			slots.forEach((slot) => {
				slot.available = true;

				var slotStartTime = slot.startTime;
				var slotEndTime = slot.endTime;

				//cross check current slot against occupancies list for overlap
				occupancies.forEach(occupancy => {
					const occupancyStartTime = common.standardStringToDate(occupancy.startTime);
					const occupancyEndTime = common.standardStringToDate(occupancy.endTime);

					if ((slotStartTime >= occupancyStartTime && slotStartTime <= occupancyEndTime) ||
						(slotEndTime >= occupancyStartTime && slotEndTime <= occupancyEndTime) ||
						(slotStartTime <= occupancyStartTime && slotEndTime >= occupancyEndTime)) {

						//overlapped....not available
						slot.available = false;
					}
				});

				//cross check current slot is in the pass
				const now = common.getNowUTCTimeStamp();
				if (slotStartTime < now) {
					slot.available = false;
				}

			});
		})
		.catch(err => {
			throw err;
		});
	
	

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

function slotToOutuptObj(slot) {
	var outputObj = new Object();
	outputObj.index = slot.index;
	outputObj.startTime = common.dateToStandardString(slot.startTime);
	outputObj.endTime = common.dateToStandardString(slot.endTime);
	outputObj.available = slot.available;

	return outputObj;
}

module.exports = {
	getSlots,
	getEndSlots
}
