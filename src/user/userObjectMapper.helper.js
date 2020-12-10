function toOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user._id.toString();
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;
	outputObj.name = user.name;
	outputObj.partyId = user.partyId;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.userType = user.userType;
	outputObj.lastLoginTime = user.lastLoginTime;

	if (user.groups != null && user.groups.length > 0) {
		outputObj.groups = user.groups;
	}

	return outputObj;
}

module.exports = {
	toOutputObj
}