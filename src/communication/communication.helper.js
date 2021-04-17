const utility = require("../common/utility");
const {customError} = utility;

function validateSenderEmailAddress(sender){
    const validSenders = [
        "booking@hebewake.com",
		"registration@hebewake.com",
		"booking@gogowake.com",
		"registration@gogowake.com"
    ]

    if(!validSenders.includes(sender))
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid sender" };
}

module.exports = {
	validateSenderEmailAddress
}