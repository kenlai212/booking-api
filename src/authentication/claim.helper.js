"use strict";
const utility = require("../common/utility");
const {customError} = utility;

function validateUserStatus(userStatus){
    const validUserStatuses = []

    if(!validUserStatuses.includes(userStatus))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userStatus" };
}

function validateGroup(group){
    const validGroups = []

    if(!validGroups.includes(group))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Group" };
}

module.exports = {
    validateUserStatus,
    validateGroup
}