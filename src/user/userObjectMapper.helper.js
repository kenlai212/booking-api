function toOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user._id.toString();
	outputObj.emailAddress = user.emailAddress;
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;

	if (user.groups != null && user.groups.length > 0) {
		outputObj.groups = user.groups;
	}
	
	outputObj.name = user.name;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.userType = user.userType;
	outputObj.telephoneCountryCode = user.telephoneCountryCode;
	outputObj.telephoneNumber = user.telephoneNumber;

	return outputObj;
}

module.exports = {
	toOutputObj
}