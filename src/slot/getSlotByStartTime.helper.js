function getSlotByStartTime(startTime, slots) {
	for (var i = 0; i < slots.length; i++) {

		if (startTime >= slots[i].startTime && startTime <= slots[i].endTime) {
			return slots[i];
		}
	}
}

module.exports = {
	getSlotByStartTime
}