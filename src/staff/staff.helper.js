"use strict";
const utility = require("../common/utility");
const {logger, customError} = utility;

function validateStatus(status){
	const validStatuses = [ "ACTIVE", "INACTIVE" ]

	if(!validStatuses.includes(status))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid status" };
}

module.exports = {
	validateStatus
}