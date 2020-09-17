const moment = require("moment");

function isoStrToDate(isoStr, utcOffSet) {
	const dateStr = isoStr.substr(0, 10);
	const dateRes = dateStr.split("-");

	const timeStr = isoStr.substr(11, 8);
	const timeRes = timeStr.split(":")

	const targetDateTime = moment()
		.utcOffset(utcOffSet)
		.set({
			year: dateRes[0],
			month: dateRes[1] - 1,
			Date: dateRes[2],
			hour: timeRes[0],
			minute: timeRes[1],
			second: timeRes[2],
			millisecond: 0
		}).toDate();

	return targetDateTime;
}

module.exports = {
	isoStrToDate
}