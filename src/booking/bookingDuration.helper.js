const config = require("config");

function checkMimumDuration(startTime, endTime){
    const diffMs = (endTime - startTime);
    const minMs = config.get("booking.minimumBookingDuration");

    if (diffMs < minMs) {

        var minutes = Math.floor(minMs / 60000);
        var seconds = ((minMs % 60000) / 1000).toFixed(0);

        throw "Booking cannot be less then " + minutes + " mins " + seconds + " secs";
    }

    return;
}

function checkMaximumDuration(startTime, endTime){
    const diffMs = (endTime - startTime);
    const maxMs = config.get("booking.maximumBookingDuration");

    if (diffMs > maxMs) {

        var minutes = Math.floor(maxMs / 60000);
        var seconds = ((maxMs % 60000) / 1000).toFixed(0);

        throw "Booking cannot be more then " + minutes + " mins " + seconds + " secs";
    }

    return;
}

function checkEarliestStartTime(startTime){
    const earlistBookingHour = config.get("booking.earliestBooking.hour");
    const earlistBookingMinute = config.get("booking.earliestBooking.minute");

    var earliestStartTime = new Date(startTime);
	earliestStartTime.setUTCHours(earlistBookingHour);
	earliestStartTime.setUTCMinutes(earlistBookingMinute);

	if (startTime < earliestStartTime) {
		throw "Booking cannot be earlier then 0" + earlistBookingHour + ":" + earlistBookingMinute;
    }
    
    return;
}

function checkLatestEndTime(endTime){
    const latestBookingHour = config.get("booking.latestBooking.hour");
    const latestBookingMinute = config.get("booking.latestBooking.minute");

    var latestEndTime = new Date(endTime);
    latestEndTime.setUTCHours(latestBookingHour);
    latestEndTime.setUTCMinutes(latestBookingMinute);

    if (endTime > latestEndTime) {
        throw "Booking cannot be later then " + latestBookingHour + ":" + latestBookingMinute;
    }

    return;
}

module.exports = {
    checkMimumDuration,
    checkMaximumDuration,
    checkEarliestStartTime,
    checkLatestEndTime
}