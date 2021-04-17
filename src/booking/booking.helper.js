"use strict";
const utility = require("../common/utility");
const {logger, customError} = utility;

function validateBookingType(bookingType){
    const validBookingTypes = [ "CUSTOMER_BOOKING", "OWNER_BOOKING" ];

    if(!validBookingTypes.includes(bookingType))
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingType" };
}

function validateAssetId(assetId){
    if(assetId != "MC_NXT20")
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

module.exports = {
    validateAssetId,
    validateBookingType
}