
const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");

const logger = require("../logger").logger;
const customError = require("../customError");

const FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com";

async function getSocialProfileFromFacebook(token){
	const url = `${FACEBOOK_GRAPH_API_URL}/me?fields=id,name,email,picture&access_token=${token}`;

	const response = await axios.get(url);
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
    getSocialProfileFromFacebook,
    getSocialProfileFromGoogle,
    SocialProfile
}