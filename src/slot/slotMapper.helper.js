const moment = require("moment");

module.exports = function (slot) {
	var outputObj = new Object();
	outputObj.index = slot.index;
	outputObj.startTime = moment(slot.startTime).toDate();
	outputObj.endTime = moment(slot.endTime).toDate();
	outputObj.available = slot.available;

	return outputObj;
}