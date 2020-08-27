const moment = require("moment");

module.exports = function (dayStartTime, dayEndTime) {
	var slots = new Array();

	var slotStartTime = dayStartTime;
	var slotEndTime = dayStartTime;
	var index = 0;
	while (slotEndTime <= dayEndTime) {

		var slot = new Object();
		slot.index = index;

		slot.startTime = slotStartTime;

		slotEndTime = moment(slotStartTime).add(29, "minutes").add(59, "seconds");
		slot.endTime = slotEndTime.toDate();

		slots.push(slot);

		index++;
		slotStartTime = moment(slotEndTime).add(1, "seconds").toDate();
	}

	return slots;
}