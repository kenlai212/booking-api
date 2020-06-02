const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../server");
const helper = require("../src/helper");

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

    var todayStart = new Date();
    todayStart.setHours(0);
    todayStart.setMinutes(0);
    todayStart.setSeconds(0);

    var tomorrowEnd = new Date();
    tomorrowEnd.setHours(23);
    tomorrowEnd.setMinutes(59);
    tomorrowEnd.setSeconds(59);

    describe("testing getSlots", function () {

        before(() => {
            var occupancies = getOccupancies(helper.dateToStandardString(todayStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            deleteOccupancies(occupancies);

            //add one day
            var startTime = new Date();
            startTime.setDate(startTime.getDate() + 1);

            startTime.setHours(11);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            var endTime = new Date(startTime);
            endTime.setHours(12);
            endTime.setMinutes(59);
            endTime.setMinutes(59);
            occupyAsset(helper.dateToStandardString(startTime), helper.dateToStandardString(endTime), "MC_NXT20");

            startTime.setHours(15);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            var endTime = new Date(startTime);
            endTime.setHours(16);
            endTime.setMinutes(59);
            endTime.setMinutes(59);
            occupyAsset(helper.dateToStandardString(startTime), helper.dateToStandardString(endTime), "MC_NXT20");
            
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

        var now = new Date();
        now.setHours(now.getHours() + 8);
        var nowStr = helper.dateToStandardString(now);
        const todayStr = nowStr.slice(0, 10);
        const nowHourStr = nowStr.substr(11, 2);
        const minSlotIndex = nowHourStr - 5;
        
        it("success, test today, any slots before current time should have available = false, should return 200 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=" + todayStr)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    const slots = response.body;
                    assert.equal(slots.length, 15);
                    
                    slots.forEach(slot => {
                        if (slot.index <= minSlotIndex) {
                            assert.equal(slot.available, false);
                        }
                    });
                });
        });

        now = new Date();
        now.setDate(now.getDate() + 1);
        nowStr = helper.dateToStandardString(now);
        const tomorrowStr = nowStr.slice(0, 10);

        it("success, test tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=" + tomorrowStr)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    const slots = response.body;
                    assert.equal(slots.length, 15);
                    assert.equal(slots[2].available, false);
                    assert.equal(slots[3].available, false);
                    assert.equal(slots[4].available, false);
                    assert.equal(slots[5].available, true);
                    assert.equal(slots[6].available, false);
                    assert.equal(slots[7].available, false);
                    assert.equal(slots[8].available, false);
                    assert.equal(slots[9].available, true);
                });
        });
    });

    describe("testing getEndSlots", function () {

        before(() => {
            var occupancies = getOccupancies(helper.dateToStandardString(todayStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            deleteOccupancies(occupancies);

            //add one day
            var startTime = new Date();
            startTime.setDate(startTime.getDate() + 1);

            startTime.setHours(11);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            var endTime = new Date(startTime);
            endTime.setHours(12);
            endTime.setMinutes(59);
            endTime.setMinutes(59);
            occupyAsset(helper.dateToStandardString(startTime), helper.dateToStandardString(endTime), "MC_NXT20");

            startTime.setHours(15);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            var endTime = new Date(startTime);
            endTime.setHours(16);
            endTime.setMinutes(59);
            endTime.setMinutes(59);
            occupyAsset(helper.dateToStandardString(startTime), helper.dateToStandardString(endTime), "MC_NXT20");
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

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        var startTimeStr = helper.dateToStandardString(startTime);
        const startTimeDateStr = startTimeStr.slice(0, 10);

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T08:00:aa")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("successfully get end-slots starting form 05:00:00, should return 2 end-slots, weekday - unit cost should 1200 HKD, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T05:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 3);
                    assert.equal(response.body[0].startTime, startTimeDateStr + "T05:00:00");
                    assert.equal(response.body[1].startTime, startTimeDateStr + "T06:00:00");
                    assert.equal(response.body[2].startTime, startTimeDateStr + "T07:00:00");

                    //if startTime is on weekEnd vs weekDay, the totalAmount will be different
                    var day = startTime.getDay();
                    var isWeekend = (day === 6) || (day === 0);
                    if (isWeekend) {
                        assert.equal(response.body[0].totalAmount, 1200);
                        assert.equal(response.body[1].totalAmount, 2400);
                        assert.equal(response.body[2].totalAmount, 3600);
                    } else {
                        assert.equal(response.body[0].totalAmount, 1000);
                        assert.equal(response.body[1].totalAmount, 2000);
                        assert.equal(response.body[2].totalAmount, 3000);
                    }
                    
                    assert.equal(response.body[0].currency, "HKD");
                    assert.equal(response.body[1].currency, "HKD");
                    assert.equal(response.body[2].currency, "HKD");
                });
        });

        it("successfully get end-slots starting form 08:00:00, should return 0 end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T08:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 0);
                });
        });

        it("successfully get end-slots starting form 10:00:00, should return 2 end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T10:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 2);
                    assert.equal(response.body[0].startTime, startTimeDateStr + "T10:00:00");
                    assert.equal(response.body[1].startTime, startTimeDateStr + "T11:00:00");
                    //if startTime is on weekEnd vs weekDay, the totalAmount will be different
                    var day = startTime.getDay();
                    var isWeekend = (day === 6) || (day === 0);
                    if (isWeekend) {
                        assert.equal(response.body[0].totalAmount, 1200);
                        assert.equal(response.body[1].totalAmount, 2400);
                    } else {
                        assert.equal(response.body[0].totalAmount, 1000);
                        assert.equal(response.body[1].totalAmount, 2000);
                    }

                    assert.equal(response.body[0].currency, "HKD");
                    assert.equal(response.body[1].currency, "HKD");
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

function deleteOccupancies(occupancies) {

    var deleteResults = [];

    if (occupancies.length > 0) {
    
        const url = "http://api.occupancy.hebewake.com/occupancy";
        const headers = {
            "Authorization": "Token " + accessToken,
            "content-Type": "application/json",
        }

        occupancies.forEach(occupancy => {
            var data = {
                "occupancyId": occupancy.id
            }

            fetch(url, { method: 'DELETE', headers: headers, body: JSON.stringify(data) })
                .then(res => {
                    deleteResults.push(res.json());
                })
                .catch(err => { console.log(err); });
        });
    }

    return deleteResults;
}

function getOccupancies(startTime, endTime, assetId) {
    const url = "http://api.occupancy.hebewake.com/occupancies?startTime="+ startTime +"&endTime=" + endTime + "&assetId=" + assetId;
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }

    var response = new Object();
    fetch(url, { method: 'GET', headers: headers })
        .then(async res => {
            response = await res.json();
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