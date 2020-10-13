const moment = require("moment");

module.exports = function (slot, showAvailable) {
	var outputObj = new Object();
	outputObj.index = slot.index;
	outputObj.startTime = slot.startTime;
	outputObj.endTime = slot.endTime;

	if (showAvailable == true) {
		outputObj.available = slot.available;
	}

	return outputObj;
}