/*
 * check if the time between startTime and endTime will
 * overlap any entries in occupancies array.
 * Returns ture or false
 * */
function checkAvailability(startTime, endTime, occupancies) {
	var isAvailable = true;

	occupancies.forEach((item) => {
		if ((startTime >= item.startTime && startTime <= item.endTime) ||
			(endTime >= item.startTime && endTime <= item.endTime) ||
			(startTime <= item.startTime && endTime >= item.endTime)) {
			isAvailable = false;
		}
	});
	
	return isAvailable;
}

module.exports = {
	checkAvailability
}