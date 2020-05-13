const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../server");

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_DOMAIN = "http://api.authentication.hebewake.com";
const LOGIN_SUBDOMAIN = "/login";
const AUTHENTICATION_API_LOGIN = "ken";
const AUTHENTICATION_API_PASSWORD = "Maxsteel1596";
var accessToken;

describe('Slot Endpoints', () => {

    //call login api to get accessToken
    before(async () => {
        if (accessToken == null) {
            await callLoginAPI()
                .then(accessTokenObj => {
                    accessToken = accessTokenObj.accessToken;
                });
        }
    });

    describe("testing getSlots", function () {

        before(async () => {
            var occupancies = await getOccupancies("2020-05-10T00:00:00","2020-05-10T23:59:59","MC_NXT20");
            await deleteOccupancies(occupancies);
            await occupyAsset("2020-05-10T11:00:00", "2020-05-10T11:59:59", "MC_NXT20");
            await occupyAsset("2020-05-10T15:00:00", "2020-05-10T15:59:59", "MC_NXT20");
            
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/slots")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing targetDate, should return 400 status", async () => {
            await chai.request(server)
                .get("/slots")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "targetDate is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid targetDate format, should return 400 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid targetDate format");
                    assert.equal(response.status, 400);
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=2020-05-10")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 14);
                    assert.equal(response.body[4].available, true);
                    assert.equal(response.body[5].available, false);
                    assert.equal(response.body[6].available, true);
                    assert.equal(response.body[8].available, true);
                    assert.equal(response.body[9].available, false);
                    assert.equal(response.body[10].available, true);
                });
        });
    });

    describe("testing getSlots", function () {

        before(async () => {
            var occupancies = await getOccupancies("2020-05-10T00:00:00", "2020-05-10T23:59:59", "MC_NXT20");
            await deleteOccupancies(occupancies);
            await occupyAsset("2020-05-10T11:00:00", "2020-05-10T11:59:59", "MC_NXT20");
            await occupyAsset("2020-05-10T15:00:00", "2020-05-10T15:59:59", "MC_NXT20");

        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/end-slots")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime=2020-05-10T08:00:aa")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("successfully get end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime=2020-05-10T08:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length,3);
                });

            await chai.request(server)
                .get("/end-slots?startTime=2020-05-10T11:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 0);
                });

            await chai.request(server)
                .get("/end-slots?startTime=2020-05-10T12:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 3);
                });
        });
    });
});

async function occupyAsset(startTime, endTime, assetId) {
    const url = "http://api.occupancy.hebewake.com/occupancy";
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }
    const data = {
        "startTime": startTime,
        "endTime": endTime,
        "assetId": assetId,
        "occupancyType": "OPEN_BOOKING"
    }
    await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
        .catch(err => { console.log(err); });
}

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
    const url = "http://api.occupancy.hebewake.com/occupancies?startTime="+ startTime +"&endTime=" + endTime + "&assetId=" + assetId;
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