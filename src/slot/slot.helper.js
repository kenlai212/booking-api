const moment = require("moment");

function validateAssetId(assetId){
	if(assetId != "A001" || assetId != "MC_NXT20")
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

function validateBookingType(bookingType){
	if(bookingType != "CUSTOMER_BOOKING" || bookingType != "OWNER_BOOKING" || bookingType != "MAINTAINANCE"){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingType" };
	}
}

function validateOccupancyTime(startTime, endTime, bookingType){
    if (startTime > endTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	if (startTime < moment().toDate() || endTime < moment().toDate())
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Occupancy cannot be in the past" };

	if (bookingType === CUSTOMER_BOOKING_TYPE) {
		//check minimum booking duration, maximum booking duration, earliest startTime
		try {
			//checkMimumDuration(startTime, endTime);
			//checkMaximumDuration(startTime, endTime);
			//checkEarliestStartTime(startTime, UTC_OFFSET);
			//checkLatestEndTime(endTime, UTC_OFFSET);
		} catch (err) {
			throw { name: customError.BAD_REQUEST_ERROR, message: err };
		}
	}
}

function generateSlots(dayStartTime, dayEndTime) {
	let slots = new Array();

	let slotStartTime = dayStartTime;
	let slotEndTime = dayStartTime;
	let index = 0;
	while (slotEndTime <= dayEndTime) {

		var slot = new Object();
		slot.index = index;

		slot.startTime = slotStartTime;

		//set end time to every 29 minutes and 59 seconds. (each slot is alomst 0.5hrs)
		slotEndTime = moment(slotStartTime).add(29, "minutes").add(59, "seconds");
		slot.endTime = slotEndTime.toDate();

		slots.push(slot);

		index++;
		slotStartTime = moment(slotEndTime).add(1, "seconds").toDate();
	}

	return slots;
}

function getSlotByStartTime(startTime, slots) {
	for (var i = 0; i < slots.length; i++) {

		if (startTime >= slots[i].startTime && startTime <= slots[i].endTime) {
			return slots[i];
		}
	}
}

function setSlotsAvailabilities(slots, occupancies) {
	slots.forEach((slot) => {
		slot.available = true;

		let slotStartTime = slot.startTime;
		let slotEndTime = slot.endTime;
		
		//cross check current slot against occupancies list for overlap
		occupancies.forEach(occupancy => {
			const occupancyStartTime = moment(occupancy.startTime).toDate();
			const occupancyEndTime = moment(occupancy.endTime).toDate();
			
			if ((slotStartTime >= occupancyStartTime && slotStartTime <= occupancyEndTime) ||
				(slotEndTime >= occupancyStartTime && slotEndTime <= occupancyEndTime) ||
				(slotStartTime <= occupancyStartTime && slotEndTime >= occupancyEndTime)) {

				//overlapped....not available
				slot.available = false;
			}
		});

		//cross check current slot is in the pass
		const now = moment().toDate();
		if (slotStartTime < now) {
			slot.available = false;
		}

	});

	return slots;
}

//for customer bookings
//on each occupancy, restrict x hours prior to startTime
//to enforce minimum time restriction
function setCustomerBookingStartSlotsRestriction(occupancies, hoursOfRestriction) {
	occupancies.forEach(occupancy => {
		occupancy.startTime = moment(occupancy.startTime).subtract(hoursOfRestriction, "hours").toDate();
	});

	return occupancies;
}

//add a buffer slot to the end of each occupancy
function setBetweenBookingBufferSlot(occupancies) {
	occupancies.forEach(occupancy => {
		occupancy.endTime = moment(occupancy.endTime).add(30, "minutes").toDate();
	});

	return occupancies;
}

module.exports = {
	validateAssetId,
	validateBookingType,
	validateOccupancyTime,
	generateSlots,
	getSlotByStartTime,
	setSlotsAvailabilities,
	setCustomerBookingStartSlotsRestriction,
	setBetweenBookingBufferSlot
}