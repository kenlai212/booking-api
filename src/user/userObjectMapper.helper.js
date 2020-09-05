function toOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user.id;
	outputObj.emailAddress = user.emailAddress;
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;
	outputObj.groups = user.groups;
	outputObj.name = user.name;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.history = user.history;
	outputObj.userType = user.userType;
	outputObj.telephoneCountryCode = user.telephoneCountryCode;
	outputObj.telephoneNumber = user.telephoneNumber;

	return outputObj;
}

module.exports = {
	toOutputObj
}