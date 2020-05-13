const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../server");
const helper = require("../src/helper");
const Booking = require("../src/booking.model").Booking;

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_DOMAIN = "http://api.authentication.hebewake.com";
const LOGIN_SUBDOMAIN = "/login";
const AUTHENTICATION_API_LOGIN = "ken";
const AUTHENTICATION_API_PASSWORD = "Maxsteel1596";
var accessToken;

describe('Booking Endpoints', () => {

    //call login api to get accessToken
    before(async () => {
        if (accessToken == null) {
            await callLoginAPI()
                .then(accessTokenObj => {
                    accessToken = accessTokenObj.accessToken;
                });
        }
    });

    describe("testing newBooking", function () {

        before(async () => {
            var todayStart = new Date();
            todayStart.setUTCHours(0);
            todayStart.setUTCMinutes(0);
            todayStart.setUTCSeconds(0);
            
            var todayEnd = new Date();
            todayEnd.setUTCHours(23);
            todayEnd.setUTCMinutes(59);
            todayEnd.setUTCSeconds(59);

            var occupancies = await getOccupancies(helper.dateToStandardString(todayStart), helper.dateToStandardString(todayEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            Booking.deleteMany().exec();
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .post("/booking")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime":"abc"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "endTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T07:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime");
                    assert.equal(response.status, 400);
                });
        });

        it("less then 119 mins 59 sec, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T08:30:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be less then 119 mins 59 secs");
                    assert.equal(response.status, 400);
                });
        });

        it("more then 479 mins 59 sec, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T20:30:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be more then 479 mins 59 secs");
                    assert.equal(response.status, 400);
                });
        });

        it("earlier then 5am, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T04:00:00",
                    "endTime": "2020-05-10T05:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be earlier then 05:00");
                    assert.equal(response.status, 400);
                });
        });

        it("later then 8pm, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T18:00:00",
                    "endTime": "2020-05-10T21:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be later then 20:00");
                    assert.equal(response.status, 400);
                });
        });

        it("booking in the past, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T15:00:00",
                    "endTime": "2020-05-10T19:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be in the past");
                    assert.equal(response.status, 400);
                });
        });

        var startTime = new Date();
        startTime.setHours(startTime.getHours() + 10);
        startTime.setMinutes(0);
        startTime.setSeconds(0);
        const startTimeStr = helper.dateToStandardString(startTime);

        var endTime = new Date();
        endTime.setHours(endTime.getHours() + 12);
        endTime.setMinutes(0);
        endTime.setSeconds(0);
        const endTimeStr = helper.dateToStandardString(endTime);

        it("missing contactName, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr
                })
                .then(response => {
                    assert.equal(response.body.error, "contactName is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode":"123"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid telephoneCountryCode");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("missing emailAddress, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber":"12345678"
                })
                .then(response => {
                    assert.equal(response.body.error, "emailAddress is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("success new booking, should return 200 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    const booking = response.body;
                    assert(booking.id);
                    assert(booking.occupancyId);
                    assert.equal(booking.startTime, startTimeStr);
                    assert.equal(booking.endTime, endTimeStr);
                    assert.equal(booking.totalAmount, 3600);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                });
        });

        it("timeslot not available, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "timeslot not available");
                });
        });
    });
});

async function deleteOccupancies(occupancies) {

    var deleteResults = [];

    if (occupancies.length > 0) {

        const url = "http://api.occupancy.hebewake.com/occupancy";
        const headers = {
            "Authorization": "Token " + accessToken,
            "content-Type": "application/json",
        }

        occupancies.forEach(async occupancy => {
            var data = {
                "occupancyId": occupancy.id
            }

            var deleteResult;
            await fetch(url, { method: 'DELETE', headers: headers, body: JSON.stringify(data) })
                .then(res => {
                    deleteResult => res.json();
                })
                .catch(err => { console.log(err); });

            deleteResults.push(deleteResult);
        });
    }

    return deleteResults;
}

async function getOccupancies(startTime, endTime, assetId) {
    const url = "http://api.occupancy.hebewake.com/occupancies?startTime=" + startTime + "&endTime=" + endTime + "&assetId=" + assetId;
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }

    var response = new Object();
    await fetch(url, { method: 'GET', headers: headers })
        .then(res => {
            response = res.json();
        })
        .catch(err => { console.log(err) });

    return response;
}

async function callLoginAPI() {
    const url = AUTHENTICATION_DOMAIN + LOGIN_SUBDOMAIN;
    const headers = {
        "content-Type": "application/json",
    }
    const data = {
        "loginId": AUTHENTICATION_API_LOGIN,
        "password": AUTHENTICATION_API_PASSWORD
    }

    var response;
    await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                console.log("Sucessfully got accessToken!");
                response = res.json();
            } else {
                console.log("External Authentication Login API error : " + res.statusText);
            }
        });

    return response;
}