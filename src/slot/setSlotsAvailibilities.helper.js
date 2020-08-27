const moment = require("moment");

module.exports = function (slots, occupancies) {
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