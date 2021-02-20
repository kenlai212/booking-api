function partyToOutputObj(party){
    let outputObj = new Object();
	outputObj.id = party._id.toString();

	outputObj.personalInfo = party.personalInfo;

	if(party.contact && party.contact.length > 0)
		outputObj.contact = party.contact;

	if(party.picture && party.picture.length > 0)
		outputObj.picture = party.picture;

	if(party.roles && party.roles.length > 0)
		outputObj.roles = party.roles;
    
    return outputObj;
}

module.exports = {
    partyToOutputObj
}