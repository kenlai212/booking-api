"use strict";
const utility = require("../common/utility");
const {customError} = utility;

function validateRole(role){
	const validRole = [
		"CREW",
		"CUSTOMER",
		"ADMIN"
	]

	if(!validRole.includes(role))
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid role` };

	return true;
}

function personToOutputObj(person){
    let outputObj = new Object();
	outputObj.personId = person._id;

	if(person.roles && person.roles.length > 0)
	outputObj.roles = person.roles;

    return outputObj;
}

module.exports = {
	validateRole,
	personToOutputObj
}