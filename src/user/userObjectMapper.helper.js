function toOutputObj(user) {
	var outputObj = new Object();
	outputObj.id = user._id.toString();
	outputObj.status = user.status;
	outputObj.registrationTime = user.registrationTime;
	outputObj.provider = user.provider;
	outputObj.providerUserId = user.providerUserId;
	outputObj.userType = user.userType;
	outputObj.lastLoginTime = user.lastLoginTime;
	
	if (user.groups != null && user.groups.length > 0) {
		outputObj.groups = user.groups;
	}

	outputObj.partyId = user.partyId;
	outputObj.personalInfo = user.personalInfo;

	if(user.contact != null && (user.contact.telephoneNumber != null || user.contact.emailAddress != null)){
		outputObj.contact = user.contact;
	}
	
	if(user.picture != null && user.picture.url != null){
		outputObj.picture = user.picture;
	}
	
	return outputObj;
}

module.exports = {
	toOutputObj
}