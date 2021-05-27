"use strict";
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const utility = require("../common/utility");
const {logger, customError} = utility;

const FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com";

const validGroupIds = [
	"BOOKING_ADMIN",
	"BOOKING_USER",
	"PRICING_ADMIN",
	"PRICING_USER",
	"OCCUPANCY_ADMIN",
	"NOTIFICATION_USER",
	"USER_ADMIN",
	"ASSET_ADMIN",
	"ASSET_USER",
	"CREW_ADMIN",
	"CREW_USER",
	"PARTY_ADMIN"
]

function validateProvider(provider){
	const validProviders = ["FACEBOOK", "GOOGLE"];

	if(!validProviders.includes(provider))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid provider" };
}

async function getSocialProfileFromFacebook(token){
	const url = `${FACEBOOK_GRAPH_API_URL}/me?fields=id,name,email,picture&access_token=${token}`;

	let response;
	try{
		response = await axios.get(url);
	}catch(error){
		logger.error("Facebook graph api error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Facebook Graph API error" };
	}
	
	const data = response.data;

	let socialProfile = new SocialProfile();
	socialProfile.provider = "FACEBOOK";
	socialProfile.providerUserId = data.id;
	socialProfile.name = data.name;
	socialProfile.emailAddress = data.email;
	socialProfile.pictureUrl = data.picture.data.url;

	return socialProfile;
}

async function getSocialProfileFromGoogle(token){
	const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

	let ticket;
	try{
		ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID
		});
	}catch(error){
		logger.error("Google Oauth2Client.verifyIdToken() error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
		
	const payload = ticket.getPayload();
		
	//google's payload.aud must match GOOGLE_CLIENT_ID
	if(payload.aud != process.env.GOOGLE_CLIENT_ID){
		logger.warn("Someone try to pass a google token with the wrong google Client ID");
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid GOOGEL_CLIENT_ID" };
	}

	let socialProfile = new SocialProfile();
	socialProfile.provider = "GOOGLE";
	socialProfile.providerUserId = payload.sub;
	socialProfile.name = payload.name;
	socialProfile.emailAddress = payload.email;
	socialProfile.pictureUrl = payload.picture;

	return socialProfile;
}

function validateGroupId(groupId){
    if(!validGroupIds.includes(groupId))
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid groupId" };
}

function userToOutputObj(user) {
	var outputObj = new Object();
	outputObj.userId = user._id.toString();
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

class SocialProfile{
	constructor(provider, providerUserId, name, emailAddress, pictureUrl){
		this.provider = provider;
		this.providerUserId = providerUserId
		this.name = name,
		this.emailAddress = emailAddress,
		this.pictureUrl = pictureUrl
	}
}

module.exports = {
	validGroupIds,
	validateProvider,
    getSocialProfileFromFacebook,
    getSocialProfileFromGoogle,
	validateGroupId,
    userToOutputObj
}