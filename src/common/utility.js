const moment = require("moment");

const customError = require("./customError");

function isoStrToDate(isoStr, utcOffset) {
	const dateStr = isoStr.substr(0, 10);
	const dateRes = dateStr.split("-");

	const timeStr = isoStr.substr(11, 8);
	const timeRes = timeStr.split(":")

	const targetDateTime = moment()
		.utcOffset(parseInt(utcOffset))
		.set({
			year: parseInt(dateRes[0]),
			month: parseInt(dateRes[1]) - 1,
			date: parseInt(dateRes[2]),
			hour: parseInt(timeRes[0]),
			minute: parseInt(timeRes[1]),
			second: parseInt(timeRes[2]),
			millisecond: 0
		}).toDate();

	return targetDateTime;
}

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}
}

function userGroupAuthorization(userGroups, allowGroups){
	if (userGroups == null) {
        userGroups = [];
    }

    const targetGroup = userGroups.filter(value => allowGroups.includes(value));

    if (targetGroup.length == 0) {
        throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
    }
}

module.exports = {
	isoStrToDate,
	validateInput,
	userGroupAuthorization
}