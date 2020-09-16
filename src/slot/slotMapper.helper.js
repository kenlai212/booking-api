const moment = require("moment");

module.exports = function (slot) {
	var outputObj = new Object();
	outputObj.index = slot.index;
	outputObj.startTime = slot.startTime;
	outputObj.endTime = slot.endTime;
	outputObj.available = slot.available;

	return outputObj;
}