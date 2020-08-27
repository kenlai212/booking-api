module.exports = function (startTime, endTime, occupancies) {
	var isAvailable = true;

	occupancies.forEach((item) => {
		if ((startTime >= item.startTime && startTime <= item.endTime) ||
			(endTime >= item.startTime && endTime <= item.endTime) ||
			(startTime <= item.startTime && endTime >= item.endTime)) {
			isAvailable = false;
		}
	});
	console.log(isAvailable);
	return isAvailable;
}