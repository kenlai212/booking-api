const mongoose = require("mongoose");
const Crew = require("../src/crew/crew.model").Crew;
const common = require("gogowake-common");
const logger = common.logger;
const fetch = require("node-fetch");

const AUTHENTICATION_DOMAIN = "http://api.notification.hebewake.com";
const LOGIN_PATH = "/login";
const LOGINID = "ken";
const PASSWORD = "p1";

const CREW_DOMAIN = "http://api.booking.hebewake.com";
const NEW_CREW_PATH = "/crew";

var accessToken;

mongoose.connect("mongodb+srv://hebewake:OZeoQIY6mQnmQuV7@cluster1-7sa24.mongodb.net/development?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true });

deleteAllCrews()
	.then(async () => {
		await seedCrews();
	});

async function seedCrews() {
	const url = AUTHENTICATION_DOMAIN + LOGIN_PATH;
	const headers = {
		"content-Type": "application/json",
	}
	const data = {
		"loginId": LOGINID,
		"password": PASSWORD
	}

	var response;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
		.then(async (res) => {
			if (res.status >= 200 && res.status < 300) {
				response = await res.json();
			} else {
				logger.error("External Authentication Login API error : " + res.statusText);
				response.status = res.status;
				response.message = res.statusText;
				throw response;
			}
		});

	accessToken = response.accessToken;

	const ken = {
		crewName: "Ken",
		telephoneCountryCode: "852",
		telephoneNumber: "93139332"
	}
	callAPI(ken)
		.then(result => {
			console.log(result);
		});

	const german = {
		crewName: "German",
		telephoneCountryCode: "852",
		telephoneNumber: "61893898"
	}
	callAPI(german)
		.then(result => {
			console.log(result);
		});

	const john = {
		crewName: "John",
		telephoneCountryCode: "852",
		telephoneNumber: "94508886"
	}
	callAPI(john)
		.then(result => {
			console.log(result);
		});

	const ck = {
		crewName: "CK",
		telephoneCountryCode: "852",
		telephoneNumber: "92311196"
	}
	callAPI(ck)
		.then(result => {
			console.log(result);
		});

	const zeroZeroTwo = {
		crewName: "002",
		telephoneCountryCode: "852",
		telephoneNumber: "98205861"
	}
	callAPI(zeroZeroTwo)
		.then(result => {
			console.log(result);
		});
}

async function deleteAllCrews() {
	await Crew.deleteMany().exec()
		.then(() => { console.log("Deleted all crews"); })
		.catch(err => { console.log(err); });
}

async function callAPI(data) {
	const url = CREW_DOMAIN + NEW_CREW_PATH;
	console.log("Calling External API : " + url);

	requestAttr = {
		method: "POST",
		body: JSON.stringify(data)
	}
	requestAttr.headers = {
		"Authorization": "Token " + accessToken,
		"content-Type": "application/json"
	}

	var crew;
	await common.callAPI(url, requestAttr)
		.then(result => {
			crew = result;
		});

	return crew;
}

module.exports = {
	seedCrews,
	deleteAllCrews
}