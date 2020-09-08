const moment = require("moment");

function generateSlots(dayStartTime, dayEndTime) {
	var slots = new Array();

	var slotStartTime = dayStartTime;
	var slotEndTime = dayStartTime;
	var index = 0;
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

		var slotStartTime = slot.startTime;
		var slotEndTime = slot.endTime;

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

module.exports = {
	generateSlots,
	getSlotByStartTime,
	setSlotsAvailabilities
}